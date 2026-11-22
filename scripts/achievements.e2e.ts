import { expect, test } from '@playwright/test';

test.describe('achievements', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('building a Pedestrian way earns an Achievement, shown in the window', async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });

    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      gameStore.getState().send({ type: 'BuildPedestrianWay', from: { x: 55, y: 60 }, to: { x: 58, y: 60 } });
    });

    await expect(page.getByRole('status')).toContainText('Succès : À pied');

    await page.getByRole('button', { name: 'Succès' }).first().click();
    const window = page.getByRole('dialog', { name: 'Succès' });
    await expect(window).toBeVisible();
    await expect(window).toContainText('Transports');
    await expect(window).toContainText('1 sur 7');
    await expect(window.locator('[data-done="true"]')).toContainText('À pied');
    await page.screenshot({ path: testInfo.outputPath('achievements-window.png') });
  });
});
