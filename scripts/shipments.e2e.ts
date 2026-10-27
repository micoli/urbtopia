import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
}

async function syncOpenCity(page: Page) {
  await expect.poll(() => page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().actions !== null), { timeout: 20_000 }).toBe(true);
  await page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().actions?.syncNow());
  await expect.poll(() => page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().status.kind), { timeout: 20_000 }).toBe('synced');
}

const woodIn = (page: Page) =>
  page.evaluate(async () => ((await import('../src/store/gameStore.ts')).gameStore.getState().state.storage.materials as Record<string, number | undefined>).wood ?? 0);

test('sends a Shipment to another City and receives it when that City is opened', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('urbtopia-prefs')) localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
  });
  await page.goto('/?e2e');
  await ready(page);
  await syncOpenCity(page);
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('urbtopia-cities') ?? '{}').lastPlayed as string);

  await page.getByRole('button', { name: /Settings/ }).first().click();
  await page.getByRole('button', { name: 'New city' }).click();
  await page.getByRole('button', { name: 'New city' }).click();
  await expect.poll(async () => JSON.parse((await page.evaluate(() => localStorage.getItem('urbtopia-cities'))) ?? '{}').lastPlayed).not.toBe(first);
  await page.waitForLoadState('load');
  await ready(page);
  await syncOpenCity(page);

  await page.getByRole('button', { name: /Settings/ }).first().click();
  await page.locator('.city-row').first().getByRole('button', { name: 'Open', exact: true }).click();
  await expect.poll(async () => JSON.parse((await page.evaluate(() => localStorage.getItem('urbtopia-cities'))) ?? '{}').lastPlayed).toBe(first);
  await page.waitForLoadState('load');
  await ready(page);

  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { createBuilding } = await import('../src/core/index.ts');
    const state = gameStore.getState().state;
    gameStore.getState().replaceState({ ...state, buildings: [...state.buildings, createBuilding(state.nextId, 'storehouse', 70, 70, 0)], nextId: state.nextId + 1, storage: { materials: { wood: 8 }, goods: {} } });
  });
  await expect.poll(() => page.evaluate(async () => (await import('../src/store/shipmentStore.ts')).shipmentStore.getState().status), { timeout: 20_000 }).toBe('ready');

  await page.getByRole('button', { name: /Settings/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Shipments' })).toBeVisible();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => (await import('../src/store/shipmentStore.ts')).shipmentStore.getState().shipments.map((shipment) => shipment.state))).toEqual(['waiting']);
  expect(await woodIn(page)).toBe(7);
  await expect(page.getByRole('button', { name: 'Take back' })).toBeVisible();

  await page.locator('.city-row').nth(1).getByRole('button', { name: 'Open', exact: true }).click();
  await expect.poll(async () => JSON.parse((await page.evaluate(() => localStorage.getItem('urbtopia-cities'))) ?? '{}').lastPlayed).not.toBe(first);
  await page.waitForLoadState('load');
  await ready(page);
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { createBuilding } = await import('../src/core/index.ts');
    const state = gameStore.getState().state;
    if (state.buildings.some((building) => building.type === 'storehouse')) return;
    gameStore.getState().replaceState({ ...state, buildings: [...state.buildings, createBuilding(state.nextId, 'storehouse', 70, 70, 0)], nextId: state.nextId + 1 });
  });
  await page.evaluate(async () => (await import('../src/store/shipmentStore.ts')).shipmentStore.getState().actions?.refresh());
  await expect.poll(() => woodIn(page), { timeout: 20_000 }).toBe(1);
});
