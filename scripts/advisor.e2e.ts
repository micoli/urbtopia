import { expect, test, type Page } from '@playwright/test';

async function openGame(page: Page, query: string) {
  await page.addInitScript(() => {
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' }));
    localStorage.setItem('urbtopia-flags', JSON.stringify({ advisor: true }));
  });
  await page.goto(`/?e2e&${query}`);
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
}

async function startDownload(page: Page) {
  await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().toggleSettings());
  await page.getByRole('switch', { name: /^Conseiller/ }).click();
  await page.getByRole('button', { name: 'Télécharger' }).click();
}

test('the Advisor is turned on after a download, then answers a guided question from the Town hall', async ({ page }) => {
  await openGame(page, 'advisor-fake');
  await startDownload(page);
  await expect(page.getByRole('switch', { name: /^Conseiller/ })).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { uiStore } = await import('../src/store/uiStore.ts');
    const { newGame, createBuilding } = await import('../src/core/index.ts');
    uiStore.getState().toggleSettings();
    const state = newGame({ seed: 'advisor-e2e', now: Date.now() });
    gameStore.getState().replaceState({ ...state, buildings: [createBuilding(50, 'townHall', 64, 64, 0)], nextId: 51 });
    uiStore.getState().select(50);
  });
  await page.getByRole('button', { name: 'Interroger le Conseiller' }).click();
  await page.getByRole('button', { name: 'Que dois-je faire en premier ?' }).click();
  await expect(page.locator('.advisor-answer')).toHaveText('Fake advisor answer.');
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.locator('.advisor-dialog')).toHaveCount(0);
});

test('a failed download shows the error and leaves the Advisor off', async ({ page }) => {
  await openGame(page, 'advisor-fake=fail');
  await startDownload(page);
  await expect(page.getByText('Pas assez de mémoire graphique pour faire tourner le Conseiller.')).toBeVisible();
  await expect(page.getByRole('switch', { name: /^Conseiller/ })).toHaveAttribute('aria-checked', 'false');
});

test('the Advisor setting is hidden when WebGPU is missing', async ({ page }) => {
  await openGame(page, 'advisor-fake=unsupported');
  await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().toggleSettings());
  await expect(page.getByRole('switch', { name: /^Confirmer/ })).toBeVisible();
  await expect(page.getByRole('switch', { name: /^Conseiller/ })).toHaveCount(0);
});
