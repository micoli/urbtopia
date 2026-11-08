import { expect, test } from '@playwright/test';

test('natural construction and Codex share Citizen unlocks and real previews', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { createBuilding, newGame } = await import('../src/core/index.ts');
    const state = newGame({ seed: 'nature-browser', now: Date.now() });
    gameStore.getState().replaceState({ ...state, buildings: [...state.buildings, createBuilding(state.nextId, 'home', 60, 60, 0)], nextId: state.nextId + 1 });
  });
  await page.getByRole('button', { name: 'Construire', exact: true }).click();
  await page.getByRole('button', { name: 'Espaces verts', exact: true }).click();
  const treeInfo = page.locator('[data-codex-id="nature-tree-oak"]');
  await expect(treeInfo).toBeVisible();
  await expect(page.locator('[data-codex-id="pirate-grass"]')).toBeVisible();
  await expect(page.locator('[data-codex-id="nature-flower-purpleA"]')).toHaveCount(0);
  await expect(page.locator('[data-codex-id="pirate-palm-bend"]')).toHaveCount(0);
  await page.locator('.flyout-row', { has: treeInfo }).locator('.flyout-item').click();
  const dialog = page.getByRole('dialog', { name: 'Codex' });
  await expect(dialog.getByRole('heading', { name: 'Chêne', exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible à partir de 6 habitants', { exact: true })).toBeVisible();
  const image = dialog.locator('img');
  await expect(image).toHaveCount(1);
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(256);
  await dialog.getByRole('button', { name: 'Palmier courbé · Pirate', exact: true }).click();
  await expect(dialog.getByText('Verrouillé', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Disponible à partir de 60 habitants', { exact: true })).toBeVisible();
});
