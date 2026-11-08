import { expect, test } from '@playwright/test';
import type { CodexManifest } from '../src/codex/catalog';

for (const layout of ['A', 'B', 'C']) {
  for (const mobile of [false, true]) {
    test.describe(`codex navigation, layout ${layout}, ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });
      test('opens directly from the main navigation', async ({ page }) => {
        await page.addInitScript(layout => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout })), layout);
        await page.goto('/?e2e');
        await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        const shortcut = page.locator('[data-action="codex"]');
        await expect(shortcut).toBeVisible();
        await expect(shortcut.locator('img')).toHaveAttribute('src', /\/assets\/icons\/codex\.png$/);
        await expect(page.locator('[data-action="settings"] img')).toHaveAttribute('src', /\/assets\/icons\/settings\.png$/);
        await shortcut.click();
        const dialog = page.getByRole('dialog', { name: 'Codex' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Logement', exact: true })).toBeVisible();
        if (mobile) await dialog.getByRole('button', { name: 'Logement', exact: true }).click();
        await expect(dialog.getByRole('heading', { name: 'Logement', exact: true })).toBeVisible();
        await expect(dialog.locator('img')).toHaveCount(8);
        await expect(dialog.locator('img').first()).toBeVisible();
        if (mobile) {
          const bounds = await dialog.boundingBox();
          expect(bounds!.x).toBeGreaterThanOrEqual(12);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(378);
          const back = dialog.locator('.codex-header').getByRole('button', { name: 'Retour à la liste' });
          const backBounds = await back.boundingBox();
          const closeBounds = await dialog.getByRole('button', { name: 'Fermer', exact: true }).boundingBox();
          expect(backBounds!.x + backBounds!.width).toBeLessThanOrEqual(closeBounds!.x);
          await back.click();
          await expect(dialog.getByRole('button', { name: 'Logement', exact: true })).toBeFocused();
        }
        await dialog.getByRole('button', { name: 'Transports', exact: true }).click();
        await dialog.getByRole('button', { name: 'Gare ferroviaire', exact: true }).click();
        await expect(dialog.getByRole('heading', { name: 'Gare ferroviaire', exact: true })).toBeVisible();
        await expect(dialog.getByText('Verrouillé', { exact: true })).toBeVisible();
        await expect(dialog.getByText('Disponible à partir de 600 habitants', { exact: true })).toBeVisible();
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Réglages', exact: true })).toHaveCount(0);
        if (layout === 'B') {
          await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeFocused();
          await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        } else {
          await expect(shortcut).toBeFocused();
        }
        await page.getByRole('button', { name: /Réglages/, exact: false }).click();
        const settingsBounds = await page.locator('.settings-dialog').boundingBox();
        const viewport = page.viewportSize()!;
        expect(settingsBounds!.x).toBeGreaterThanOrEqual(0);
        expect(settingsBounds!.y).toBeGreaterThanOrEqual(0);
        expect(settingsBounds!.x + settingsBounds!.width).toBeLessThanOrEqual(viewport.width);
        expect(settingsBounds!.y + settingsBounds!.height).toBeLessThanOrEqual(viewport.height);
        await page.getByRole('button', { name: 'Fermer', exact: true }).click();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        await page.getByRole('button', { name: 'Construire', exact: true }).click();
        await page.getByRole('button', { name: 'Production', exact: true }).click();
        const workshopInfo = page.getByRole('button', { name: 'À propos de Atelier', exact: true });
        const manifestResponse = await page.request.get('/codex/manifest.json');
        const manifest = await manifestResponse.json() as CodexManifest;
        await expect(workshopInfo.locator('img')).toHaveAttribute('src', `./codex/${manifest.images['workshop:1']}`);
        await expect(workshopInfo).not.toHaveText('?');
        const workshopLabel = page.locator('.flyout-row', { has: workshopInfo }).locator('.flyout-item');
        await workshopLabel.click();
        await expect(dialog.getByRole('heading', { name: 'Atelier', exact: true })).toBeVisible();
        await expect(page.locator('.confirm-pad')).toHaveCount(0);
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(workshopLabel).toBeFocused();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        await page.getByRole('button', { name: 'Reseaux', exact: true }).click();
        const roadInfo = page.getByRole('button', { name: 'À propos de Route', exact: true });
        await expect(roadInfo.locator('img')).toHaveAttribute('src', `./codex/${manifest.images['road:1']}`);
        const roadLabel = page.locator('.flyout-row', { has: roadInfo }).locator('.flyout-item');
        await roadLabel.click();
        await expect(dialog.getByRole('heading', { name: 'Route', exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(roadLabel).toBeFocused();
      });
    });
  }
}

test('codex previews are included in the offline cache', async ({ request }) => {
  const response = await request.get('/codex/manifest.json');
  const manifest = await response.json() as CodexManifest;
  const worker = await request.get('/sw.js');
  const source = await worker.text();
  expect(source).toContain('./codex/manifest.json');
  for (const file of new Set(Object.values(manifest.images))) expect(source).toContain(`./codex/${file}`);
});

test('codex previews remain available offline after PWA installation', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
  await page.goto('/?e2e');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.locator('[data-action="codex"]').click();
  const dialog = page.getByRole('dialog', { name: 'Codex' });
  await dialog.getByRole('button', { name: 'Logement solaire', exact: true }).click();
  await expect(dialog.locator('img')).toHaveCount(8);
  await expect.poll(() => dialog.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0)), { timeout: 30_000 }).toBe(true);
  await context.setOffline(true);
  const sources = await dialog.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(await page.evaluate(async sources => {
    const responses = await Promise.all(sources.map(source => fetch(source)));
    return responses.every(response => response.ok);
  }, sources)).toBe(true);
});
