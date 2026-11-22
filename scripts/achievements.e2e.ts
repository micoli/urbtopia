import { readFileSync } from 'node:fs';
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

  test('an old save gets the Achievements its City proves, with one summary toast', async ({ page }) => {
    const oldSave = readFileSync(new URL('../src/persistence/fixtures/save-v21.json', import.meta.url), 'utf8');
    await page.addInitScript((save) => {
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' }));
      const envelope = JSON.parse(save);
      envelope.savedAt = Date.now();
      envelope.state.lastSeen = Date.now();
      localStorage.setItem('urbtopia-save', JSON.stringify(envelope));
    }, oldSave);
    await page.goto('/?e2e');
    await expect(page.getByRole('status')).toContainText('1 succès reconnus dans votre City', { timeout: 30_000 });
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });

    await page.getByRole('button', { name: 'Succès' }).first().click();
    const window = page.getByRole('dialog', { name: 'Succès' });
    await expect(window).toContainText('1 sur 7');
    await expect(window.locator('[data-done="true"]')).toContainText('Première route');
  });
});
