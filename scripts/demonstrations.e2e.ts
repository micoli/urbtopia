import { expect, test } from '@playwright/test';

for (const mobile of [false, true]) {
  test.describe(`guided demonstrations on ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
      await page.goto('/?e2e');
      await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { venueStore } = await import('../src/store/venueStore.ts');
        const { newGame, createBuilding } = await import('../src/core/index.ts');
        const base = newGame({ seed: 'guided-demonstration-e2e', now: Date.now(), tutorial: false, venueTutorials: false });
        gameStore.getState().replaceState({ ...base, buildings: [createBuilding(50, 'factory', 64, 64, 0)], nextId: 51 });
        venueStore.getState().open(50);
      });
    });

    test('restores step states, protects the City and returns to Management', async ({ page }) => {
      const room = page.getByRole('dialog', { name: 'Manage', exact: true });
      await room.getByRole('button', { name: 'Management', exact: true }).click();
      await room.getByRole('button', { name: 'Demonstrations', exact: true }).click();
      await page.getByRole('button', { name: /Simple — Make a Press/ }).click();
      const demo = page.getByRole('dialog', { name: 'Factory — Simple', exact: true });
      await expect(demo.getByRole('heading', { name: 'A first working layout', exact: true })).toBeVisible();
      const readCity = () => page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { state, paused } = gameStore.getState();
        return { urbs: state.urbs, storage: state.storage, rng: state.rngState, fixtures: state.buildings.find(building => building.id === 50)?.interior?.fixtures ?? [], paused };
      });
      const before = await readCity();
      expect(before.paused).toBe(true);
      await demo.getByRole('combobox', { name: 'Steps', exact: true }).selectOption('4');
      await expect(demo.getByRole('heading', { name: 'Connect the Shaft', exact: true })).toBeVisible();
      await expect(demo.locator('.demonstration-indicators')).toContainText('1 / 1');
      await expect(demo.locator('.demonstration-indicators')).toContainText('930');
      await demo.getByRole('button', { name: 'Play automatically', exact: true }).click();
      await expect(demo.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      await demo.getByRole('button', { name: 'Previous step', exact: true }).click();
      await expect(demo.getByRole('button', { name: 'Play automatically', exact: true })).toBeVisible();
      await expect(demo.locator('.demonstration-indicators')).toContainText('0 / 1');
      await expect(demo.locator('.demonstration-indicators')).toContainText('900');
      await demo.getByRole('button', { name: 'Restart', exact: true }).click();
      await expect(demo.getByRole('button', { name: 'Previous step', exact: true })).toBeDisabled();
      expect(await readCity()).toEqual(before);
      await demo.press('Escape');
      await expect(demo).toHaveCount(0);
      await expect(room).toBeVisible();
      expect(await readCity()).toEqual({ ...before, paused: false });
    });

    test('opens above the native Codex dialog even without a player Factory', async ({ page }) => {
      await page.evaluate(async () => {
        const { venueStore } = await import('../src/store/venueStore.ts');
        const { uiStore } = await import('../src/store/uiStore.ts');
        const { gameStore } = await import('../src/store/gameStore.ts');
        venueStore.getState().close();
        gameStore.getState().replaceState({ ...gameStore.getState().state, buildings: [] });
        uiStore.getState().openCodex(undefined, 'productionInteriors');
      });
      const codex = page.getByRole('dialog', { name: 'Codex', exact: true });
      await codex.getByRole('button', { name: 'Demonstrations', exact: true }).click();
      await page.getByRole('button', { name: /Simple — Make a Press/ }).click();
      const demo = page.getByRole('dialog', { name: 'Factory — Simple', exact: true });
      await expect(demo).toBeVisible();
      await expect(demo.getByRole('heading', { name: 'A first working layout', exact: true })).toBeVisible();
      await demo.getByRole('button', { name: 'Close demonstration', exact: true }).click();
      await expect(codex).toBeVisible();
    });
  });
}
