import { expect, test } from '@playwright/test';

for (const mobile of [false, true]) {
  test.describe(`solidarity, ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });

    test('donates with a preview, preserves pending Medal progress after a reset, and explains the rules in the Codex', async ({ page }, testInfo) => {
      await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
      await page.goto('/?e2e');
      await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { uiStore } = await import('../src/store/uiStore.ts');
        const { newGame, createBuilding } = await import('../src/core/index.ts');
        const state = newGame({ seed: 'solidarity-ui', now: Date.now() });
        gameStore.getState().replaceState({ ...state, marketUnlocked: true, buildings: [{ ...createBuilding(50, 'home', 64, 64, 0), tier: 5 }], nextId: 51, storage: { materials: {}, goods: { tools: 20 } } });
        uiStore.getState().toggleMarket();
      });
      const row = page.locator('.market-row');
      await row.getByRole('button', { name: 'Donner', exact: true }).click();
      await expect(row.locator('input, select')).toHaveCount(0);
      const quantity = row.getByRole('group', { name: 'Quantité à donner' });
      await expect(quantity.getByRole('button', { name: 'Quantité à donner −' })).toBeDisabled();
      await quantity.getByRole('button', { name: 'Quantité à donner +' }).click();
      await expect(row).toContainText('Valeur du don : 160');
      await expect(row).toContainText('Solidarité ajoutée : 19:12:00');
      await page.screenshot({ path: testInfo.outputPath('donation-preview.png') });
      await row.getByRole('button', { name: /^Donner 2 ×/ }).click();
      await expect(row.locator('.donation-form')).toHaveCount(0);
      expect(await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { solidarityStore } = await import('../src/store/solidarityStore.ts');
        return { stock: gameStore.getState().state.storage.goods.tools, value: solidarityStore.getState().value };
      })).toEqual({ stock: 18, value: 160 });

      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        gameStore.getState().replaceState({ ...gameStore.getState().state, solidarityMs: 24 * 3_600_000 });
      });
      await row.getByRole('button', { name: 'Donner', exact: true }).click();
      await quantity.getByRole('button', { name: 'Quantité à donner +' }).click();
      await quantity.getByRole('button', { name: 'Quantité à donner +' }).click();
      await expect(row).toContainText('compteront uniquement pour votre médaille');
      await row.getByRole('button', { name: /^Donner 3 ×/ }).click();
      await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().newGame(Date.now()));
      expect(await page.evaluate(async () => (await import('../src/store/solidarityStore.ts')).solidarityStore.getState().value)).toBe(400);
      await page.reload();
      await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
      expect(await page.evaluate(async () => (await import('../src/store/solidarityStore.ts')).solidarityStore.getState().value)).toBe(400);
      await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().openCodex(undefined, 'solidarity'));
      const codex = page.getByRole('dialog', { name: 'Codex' });
      await expect(codex.getByRole('heading', { name: 'Solidarité et dons' })).toBeVisible();
      await expect(codex).toContainText('Un saut de 8 heures consomme 8 heures de réserve');
      await expect(codex).toContainText('bronze à 1 000');
      await expect(codex).toContainText('la même valeur ajoute 36 minutes');
      await page.screenshot({ path: testInfo.outputPath('solidarity-codex.png') });
    });
  });
}
