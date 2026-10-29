import { expect, test } from '@playwright/test';

test.describe('attractions', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a Museum earns Takings that the player collects', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    const before = await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'attraction-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, buildings: [createBuilding(50, 'masMuseum', 64, 64, 0)], nextId: 51 });
      gameStore.getState().send({ type: 'SkipTime', hours: 6 });
      uiStore.getState().select(50);
      return gameStore.getState().state.urbs;
    });
    await expect(page.getByRole('radiogroup', { name: 'Ticket' })).toBeVisible();
    const collect = page.getByRole('button', { name: /Takings/ });
    await expect(collect).toBeEnabled();
    await collect.click();
    const after = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.urbs);
    expect(after).toBeGreaterThan(before);
    await expect(collect).toBeDisabled();
    expect(errors).toEqual([]);
  });
});
