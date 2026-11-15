import { expect, test } from '@playwright/test';

for (const mobile of [false, true]) {
  test.describe(`interior dialogs on ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
      await page.goto('/?e2e');
      await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { venueStore } = await import('../src/store/venueStore.ts');
        const { newGame, createBuilding } = await import('../src/core/index.ts');
        const state = newGame({ seed: 'interior-dialogs', now: Date.now() });
        gameStore.getState().replaceState({ ...state, urbs: 100_000, tutorial: null, buildings: [createBuilding(50, 'workshop', 64, 64, 0), createBuilding(51, 'arcade', 70, 64, 0)], nextId: 52 });
        venueStore.getState().open(50);
      });
    });

    test('closes an example only on an outside click and keeps the interior open', async ({ page }) => {
      const room = page.getByRole('dialog', { name: 'Manage', exact: true });
      await room.getByRole('button', { name: 'Management', exact: true }).click();
      await room.getByRole('button', { name: 'Examples of set-ups' }).click();
      const example = page.getByRole('dialog', { name: 'Example set-up · Workshop', exact: true });
      await expect(example).toBeVisible();
      await example.getByRole('heading', { name: 'Example set-up · Workshop' }).click();
      await expect(example).toBeVisible();
      await page.locator('.interior-example.dialog-backdrop').click({ position: { x: 2, y: 2 } });
      await expect(example).toHaveCount(0);
      await expect(room).toBeVisible();
    });

    for (const id of [50, 51]) {
      test(`closes the Codex on an outside click over building ${id}`, async ({ page }) => {
        await page.evaluate(async id => {
          const { venueStore } = await import('../src/store/venueStore.ts');
          const { uiStore } = await import('../src/store/uiStore.ts');
          venueStore.getState().open(id);
          uiStore.getState().openCodex('workshop');
        }, id);
        const codex = page.getByRole('dialog', { name: 'Codex', exact: true });
        await expect(codex).toBeVisible();
        await codex.getByRole('heading', { name: 'Codex', exact: true }).click();
        await expect(codex).toBeVisible();
        await codex.click({ position: { x: 2, y: 2 } });
        await expect(codex).toHaveCount(0);
        await expect(page.getByRole('dialog', { name: 'Manage', exact: true })).toBeVisible();
        expect(await page.evaluate(async () => {
          const { venueStore } = await import('../src/store/venueStore.ts');
          const { venueId, panel } = venueStore.getState();
          return { venueId, panel };
        })).toEqual({ venueId: id, panel: null });
      });
    }
  });
}
