import { expect, test } from '@playwright/test';

test('a Home is furnished from its panel and its Comfort follows the layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', taxBadgeThreshold: 1, layout: 'C' })));
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { uiStore } = await import('../src/store/uiStore.ts');
    const { newGame, createBuilding } = await import('../src/core/index.ts');
    type Fixture = import('../src/core/index.ts').VenueFixture;
    const state = newGame({ seed: 'home-interior', now: Date.now() });
    const fixtures: Fixture[] = [
      { id: 1, type: 'homeBed', x: 0, y: 1, rotation: 0 },
      { id: 2, type: 'homeTable', x: 2, y: 3, rotation: 0 },
      { id: 3, type: 'homeChair', x: 3, y: 3, rotation: 0 },
      { id: 4, type: 'homeTelevision', x: 3, y: 1, rotation: 0 },
      { id: 5, type: 'homeBookcase', x: 0, y: 3, rotation: 0 },
    ];
    const home = { ...createBuilding(50, 'home', 64, 64, 0), tier: 2, floor: { fixtures, nextFixtureId: 10 } };
    gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [home], nextId: 51, adaptationUntil: 0 });
    uiStore.getState().select(50);
  });
  await page.getByRole('button', { name: 'Aménager' }).click();
  const stats = page.locator('.dock-stat');
  await expect(stats.filter({ hasText: 'Confort' })).toContainText('/ 100');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/home-interior.png' });
  const before = await stats.filter({ hasText: 'Confort' }).textContent();
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const state = gameStore.getState().state;
    const home = state.buildings.find(building => building.id === 50)!;
    gameStore.getState().replaceState({ ...state, buildings: state.buildings.map(building => (building.id === 50 ? { ...home, floor: { ...home.floor!, fixtures: home.floor!.fixtures.filter(fixture => fixture.type !== 'homeTelevision') } } : building)) });
  });
  await expect.poll(async () => stats.filter({ hasText: 'Confort' }).textContent()).not.toBe(before);
  expect(errors).toEqual([]);
});
