import { expect, test } from '@playwright/test';

test('the Factory interior opens from the Factory panel and shows what the layout brings', async ({ page }) => {
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
    const state = newGame({ seed: 'factory-floor', now: Date.now() });
    const fixtures: Fixture[] = [
      { id: 1, type: 'factoryMotor', x: 3, y: 3, rotation: 0 },
      { id: 2, type: 'factoryShaft', x: 3, y: 4, rotation: 0 },
      { id: 3, type: 'factoryPress', x: 3, y: 5, rotation: 2 },
    ];
    const factory = { ...createBuilding(50, 'factory', 64, 64, 0), tier: 5, interior: { fixtures, nextFixtureId: 10 } };
    gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [factory], nextId: 51, adaptationUntil: 0, venueTutorials: { arcade: null, supermarket: null, factory: null } });
    uiStore.getState().select(50);
  });
  await page.getByRole('button', { name: "Ouvrir l'atelier de l'usine" }).click();
  const stats = page.locator('.dock-stat');
  await expect(stats.filter({ hasText: 'Machines reliées' })).toContainText('1 / 1');
  await expect(stats.filter({ hasText: 'Vitesse' })).toContainText('+20 %');
  await expect(stats.filter({ hasText: 'Électricité des moteurs' })).toBeVisible();
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const state = gameStore.getState().state;
    const factory = state.buildings.find(building => building.id === 50)!;
    gameStore.getState().replaceState({ ...state, buildings: state.buildings.map(building => (building.id === 50 ? { ...factory, interior: { ...factory.interior!, fixtures: factory.interior!.fixtures.filter(fixture => fixture.type !== 'factoryShaft') } } : building)) });
  });
  await expect(stats.filter({ hasText: 'Machines reliées' })).toContainText('0 / 1');
  await expect(stats.filter({ hasText: 'Vitesse' })).toContainText('+0 %');
  expect(errors).toEqual([]);
});
