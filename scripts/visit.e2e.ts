import { expect, test } from '@playwright/test';

test('visits a Showcase read-only and returns to the own city untouched', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });

  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { readOnlyStore } = await import('../src/store/readOnlyStore.ts');
    const { showcaseStore } = await import('../src/store/showcaseStore.ts');
    const { newGame } = await import('../src/core/index.ts');
    const { serializeEnvelope } = await import('../src/persistence/envelope.ts');
    const { FakeShowcaseClient } = await import('../src/showcase/fakeShowcaseClient.ts');
    const { VisitController } = await import('../src/showcase/visitController.ts');
    const own = newGame({ seed: 'own-city', now: Date.now() });
    gameStore.getState().replaceState(own);
    const client = new FakeShowcaseClient();
    const theirs = newGame({ seed: 'visited-city', now: Date.now() });
    client.showcases.set('u2', { cityName: 'Bobville', handle: 'Bob', avatar: null, formatVersion: 16, envelope: serializeEnvelope(theirs, Date.now()) });
    const controller = new VisitController({
      client,
      game: { state: () => gameStore.getState().state, replaceState: (state, change) => gameStore.getState().replaceState(state, change), tick: (now) => gameStore.getState().tick(now) },
      readOnly: { get: () => readOnlyStore.getState().readOnly, set: (value) => readOnlyStore.getState().set(value) },
      now: Date.now,
      onState: (visit) => showcaseStore.getState().setVisit(visit),
    });
    showcaseStore.getState().enable({ refreshHallOfFame: async () => {}, acknowledgeNotice: async () => {}, setOptOut: async () => {}, visit: (userId, cityId) => controller.visit(userId, cityId), leaveVisit: () => controller.leave() });
  });

  const before = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.seed);
  expect(before).toBe('own-city');

  await page.evaluate(async () => (await import('../src/store/showcaseStore.ts')).showcaseStore.getState().actions?.visit('u2', 'c-bob'));
  await expect(page.locator('.visit-banner')).toContainText('Bob');

  const during = await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { readOnlyStore } = await import('../src/store/readOnlyStore.ts');
    const state = gameStore.getState().state;
    gameStore.getState().send({ type: 'SellToMarket', good: 'tools', quantity: 1 });
    gameStore.getState().tick(Date.now() + 3_600_000);
    return { seed: state.seed, unchanged: gameStore.getState().state === state, blocked: readOnlyStore.getState().readOnly };
  });
  expect(during).toEqual({ seed: 'visited-city', unchanged: true, blocked: true });
  expect(await page.evaluate(() => {
    const { lastPlayed } = JSON.parse(localStorage.getItem('urbtopia-cities') ?? '{}');
    return JSON.parse(localStorage.getItem(`urbtopia-save:${lastPlayed}`) ?? '{}').state?.seed;
  })).not.toBe('visited-city');

  await page.getByRole('button', { name: 'Back to my city' }).click();
  await expect(page.locator('.visit-banner')).toHaveCount(0);
  expect(await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.seed)).toBe('own-city');
  expect(await page.evaluate(async () => (await import('../src/store/readOnlyStore.ts')).readOnlyStore.getState().readOnly)).toBe(false);
});
