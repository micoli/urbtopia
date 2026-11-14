import { expect, test } from '@playwright/test';

test('the Workshop interior opens from the Workshop panel with the example set-up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', taxBadgeThreshold: 1, layout: 'C' }));
    localStorage.setItem('urbtopia-flags', JSON.stringify({ productionInterior: true }));
  });
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { uiStore } = await import('../src/store/uiStore.ts');
    const { newGame, createBuilding, interiorExampleOf } = await import('../src/core/index.ts');
    const state = newGame({ seed: 'workshop-interior', now: Date.now() });
    const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
    const fixtures = interiorExampleOf('workshop')!.fixtures.map((piece, index) => ({ id: index + 1, ...piece }));
    const workshop = { ...createBuilding(50, 'workshop', 64, 64, 0), interior: { fixtures, nextFixtureId: fixtures.length + 1 } };
    gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [...homes, workshop], nextId: 51, adaptationUntil: 0, venueTutorials: { arcade: null, supermarket: null } });
    uiStore.getState().select(50);
  });
  await page.getByRole('button', { name: 'Open the Workshop interior' }).click();
  const room = page.getByRole('dialog', { name: 'Manage' });
  await room.getByRole('button', { name: 'Build' }).click();
  await room.locator('.build-section-toggle', { hasText: 'Line' }).click();
  await expect(room.getByText('Storage bin')).toBeVisible();
  await page.evaluate(async () => {
    const { venueStore } = await import('../src/store/venueStore.ts');
    venueStore.getState().selectPlaced(1);
  });
  await page.getByRole('combobox', { name: 'Item extracted' }).click();
  await page.getByText('Wood', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Item extracted' })).toContainText('Wood');
  await page.screenshot({ path: 'tmp/ws-render/e2e-extractor.png' });
  expect(errors).toEqual([]);
});
