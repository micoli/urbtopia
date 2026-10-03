import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CODEX_ENTRIES, codexImageKey, validateCodexManifest, type CodexManifest } from '../src/codex/catalog';

for (const layout of ['A', 'B', 'C']) {
  for (const mobile of [false, true]) {
    test.describe(`codex navigation, layout ${layout}, ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });
      test('opens directly from the main navigation and from settings', async ({ page }) => {
        await page.addInitScript(layout => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout })), layout);
        await page.goto('/');
        await expect(page.locator('#splash')).toHaveCount(0);
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        const shortcut = page.locator('[data-action="codex"]');
        await expect(shortcut).toBeVisible();
        await expect(shortcut).toContainText('📖');
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
          await dialog.getByRole('button', { name: 'Retour à la liste' }).click();
          await expect(dialog.getByRole('button', { name: 'Logement', exact: true })).toBeFocused();
        }
        await dialog.getByRole('button', { name: 'Gare ferroviaire', exact: true }).click();
        await expect(dialog.getByRole('heading', { name: 'Gare ferroviaire', exact: true })).toBeVisible();
        await expect(dialog.getByText('Verrouillé', { exact: true })).toBeVisible();
        await expect(dialog.getByText('Disponible à partir de 600 habitants', { exact: true })).toBeVisible();
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toHaveCount(0);
        if (layout === 'B') {
          await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeFocused();
          await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        } else {
          await expect(shortcut).toBeFocused();
        }
        await page.getByRole('button', { name: /Menu/, exact: false }).click();
        if (layout === 'C') {
          const bounds = await page.locator('.market-panel').boundingBox();
          const viewport = page.viewportSize()!;
          expect(viewport.width - bounds!.x - bounds!.width).toBe(3);
          expect(viewport.height - bounds!.y - bounds!.height).toBe(3);
        }
        if (layout === 'B') {
          const bounds = await page.locator('.sheet').boundingBox();
          const viewport = page.viewportSize()!;
          expect(viewport.width - bounds!.x - bounds!.width).toBeGreaterThanOrEqual(3);
          expect(viewport.height - bounds!.y - bounds!.height).toBe(3);
        }
        const settingsShortcut = page.locator('.side-panel-actions [data-action="codex"]');
        await settingsShortcut.click();
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(settingsShortcut).toBeFocused();
        await page.getByRole('button', { name: 'Fermer', exact: true }).click();
        await page.getByRole('button', { name: 'Passer le didacticiel', exact: true }).click();
        await page.getByRole('button', { name: 'Passer', exact: true }).click();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        await page.getByRole('button', { name: 'Construire', exact: true }).click();
        await page.getByRole('button', { name: 'Production et commerce', exact: true }).click();
        const workshopInfo = page.getByRole('button', { name: 'À propos de Atelier', exact: true });
        await workshopInfo.click();
        await expect(dialog.getByRole('heading', { name: 'Atelier', exact: true })).toBeVisible();
        await expect(page.locator('.confirm-pad')).toHaveCount(0);
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(workshopInfo).toBeFocused();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        await page.getByRole('button', { name: 'Routes', exact: true }).click();
        const roadInfo = page.getByRole('button', { name: 'À propos de Route', exact: true });
        await roadInfo.click();
        await expect(dialog.getByRole('heading', { name: 'Route', exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(roadInfo).toBeFocused();
      });
    });
  }
}

test('every codex page and evolution has a generated image in the deployed build', async ({ request }) => {
  const response = await request.get('/codex/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as CodexManifest;
  validateCodexManifest(manifest);
  const visited = new Set<string>();
  for (const entry of CODEX_ENTRIES) {
    for (const level of entry.levels) {
      const file = manifest.images[codexImageKey(entry.id, level)]!;
      if (visited.has(file)) continue;
      visited.add(file);
      expect(existsSync(join('dist/codex', file)), `${entry.id}, level ${level}`).toBe(true);
      const image = await request.get(`/codex/${file}`);
      expect(image.ok(), `${entry.id}, level ${level}`).toBe(true);
    }
  }
  const worker = await request.get('/sw.js');
  const source = await worker.text();
  expect(source).toContain('./codex/manifest.json');
  for (const file of visited) expect(source).toContain(`./codex/${file}`);
});

test('codex previews remain available offline after PWA installation', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await expect(page.locator('#splash')).toHaveCount(0);
  await context.setOffline(true);
  await page.locator('[data-action="codex"]').click();
  const dialog = page.getByRole('dialog', { name: 'Codex' });
  await dialog.getByRole('button', { name: 'Logement solaire', exact: true }).click();
  await expect(dialog.locator('img')).toHaveCount(8);
  const sources = await dialog.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(await page.evaluate(async sources => {
    const responses = await Promise.all(sources.map(source => fetch(source)));
    return responses.every(response => response.ok);
  }, sources)).toBe(true);
});
