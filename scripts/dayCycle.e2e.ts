import { expect, test, type Page } from '@playwright/test';

const lightOf = (page: Page) => page.evaluate(async () => {
  const { sceneHandle } = await import('../src/store/sceneHandle.ts');
  const scene = sceneHandle.current as unknown as { sun: { intensity: number } };
  return scene.sun.intensity;
});

const settle = (page: Page) => page.waitForTimeout(1500);

test.describe('day cycle', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('lights the map by the cycle hour, and ?e2e keeps it day at Night', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (localStorage.getItem('urbtopia-prefs')) return;
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'A' }));
    });

    await page.goto('/?e2e&time=23:30');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await settle(page);
    const night = await lightOf(page);

    await page.goto('/?e2e&time=12:00');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await settle(page);
    const noon = await lightOf(page);
    expect(night).toBeLessThan(noon);
    expect(night / noon).toBeGreaterThanOrEqual(0.4);

    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { cycleHourOf, cycleTimeOf } = await import('../src/core/index.ts');
      const state = gameStore.getState().state;
      const hour = cycleHourOf(cycleTimeOf(state, state.lastSeen));
      gameStore.getState().send({ type: 'SkipTime', hours: (((23.5 - hour) % 24) + 24) % 24 / 12 });
    });
    await expect(page.locator('.game-clock')).toContainText('🌙');
    await settle(page);
    expect(await lightOf(page)).toBeCloseTo(noon, 1);

    expect(errors).toEqual([]);
  });

  test('turns Always day on from the settings', async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'A' })));
    await page.goto('/?bypass-tutorial&keep-local');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { cycleHourOf, cycleTimeOf } = await import('../src/core/index.ts');
      const state = gameStore.getState().state;
      const hour = cycleHourOf(cycleTimeOf(state, state.lastSeen));
      gameStore.getState().send({ type: 'SkipTime', hours: (((23.5 - hour) % 24) + 24) % 24 / 12 });
    });
    await settle(page);
    const night = await lightOf(page);
    await page.getByRole('button', { name: 'Réglages' }).click();
    await page.getByRole('checkbox', { name: 'Toujours de jour' }).click();
    await settle(page);
    expect(await lightOf(page)).toBeGreaterThan(night);
    expect(await lightOf(page)).toBeCloseTo(1.7, 1);
  });
});
