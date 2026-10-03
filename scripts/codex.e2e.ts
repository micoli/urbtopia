import { createBuilding, newGame } from '../src/core';
import { serializeEnvelope } from '../src/persistence/envelope';
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
        await expect(shortcut.locator('img')).toHaveAttribute('src', /\/assets\/icons\/codex\.png$/);
        await expect(page.locator('[data-action="menu"] img')).toHaveAttribute('src', /\/assets\/icons\/settings\.png$/);
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
        const manifestResponse = await page.request.get('/codex/manifest.json');
        const manifest = await manifestResponse.json() as CodexManifest;
        await expect(workshopInfo.locator('img')).toHaveAttribute('src', `./codex/${manifest.images['workshop:1']}`);
        await expect(workshopInfo).not.toHaveText('?');
        await workshopInfo.click();
        await expect(dialog.getByRole('heading', { name: 'Atelier', exact: true })).toBeVisible();
        await expect(page.locator('.confirm-pad')).toHaveCount(0);
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(workshopInfo).toBeFocused();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
        await page.getByRole('button', { name: 'Routes', exact: true }).click();
        const roadInfo = page.getByRole('button', { name: 'À propos de Route', exact: true });
        await expect(roadInfo.locator('img')).toHaveAttribute('src', `./codex/${manifest.images['road:1']}`);
        await roadInfo.click();
        await expect(dialog.getByRole('heading', { name: 'Route', exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
        await expect(roadInfo).toBeFocused();
      });
    });
  }
}

test('every codex page and evolution has a generated image in the deployed build', { tag: '@images' }, async ({ request }) => {
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
});

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

test('natural construction and Codex share Citizen unlocks and real previews', async ({ page }) => {
  const state = newGame({ seed: 'nature-browser', now: Date.now() });
  state.buildings.push(createBuilding(state.nextId++, 'home', 60, 60, 0));
  await page.addInitScript(save => {
    localStorage.setItem('urbtopia-save', save);
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' }));
  }, serializeEnvelope(state, state.lastSeen));
  await page.goto('/');
  await expect(page.locator('#splash')).toHaveCount(0);
  await page.getByRole('button', { name: 'Construire', exact: true }).click();
  await page.getByRole('button', { name: 'Espaces verts', exact: true }).click();
  const treeInfo = page.locator('[data-codex-id="nature-tree-oak"]');
  await expect(treeInfo).toBeVisible();
  await expect(page.locator('[data-codex-id="pirate-grass"]')).toBeVisible();
  await expect(page.locator('[data-codex-id="nature-flower-purpleA"]')).toHaveCount(0);
  await expect(page.locator('[data-codex-id="pirate-palm-bend"]')).toHaveCount(0);
  await treeInfo.click();
  const dialog = page.getByRole('dialog', { name: 'Codex' });
  await expect(dialog.getByRole('heading', { name: 'Arbre chêne', exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible à partir de 6 habitants', { exact: true })).toBeVisible();
  const image = dialog.locator('img');
  await expect(image).toHaveCount(1);
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(512);
  await dialog.getByRole('button', { name: 'palmier courbé · Pirate', exact: true }).click();
  await expect(dialog.getByText('Verrouillé', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible à partir de 60 habitants', { exact: true })).toBeVisible();
});
