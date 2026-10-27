import { expect, test, type Page } from '@playwright/test';

async function openCity(page: Page, scene: 'denseCity' | 'cornerCity', focus: [number, number], zoomOut = 0) {
  await page.addInitScript(() => {
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' }));
    let seed = 42;
    Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  });
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async ([name, [x, y]]) => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { sceneHandle } = await import('../src/store/sceneHandle.ts');
    const { dialogStore } = await import('../src/store/dialogStore.ts');
    const scenes = await import('../scripts/visualScenes.ts');
    gameStore.getState().replaceState(scenes[name as 'denseCity' | 'cornerCity']());
    dialogStore.getState().dismissSignInPrompt();
    sceneHandle.current!.setTrafficEnabled(false);
    sceneHandle.current!.camera.focusOn(x!, y!);
  }, [scene, focus] as const);
  // The season notice and the clock follow the real date: dismiss the notice, and leave the clock out of the screenshots.
  await page.getByRole('button', { name: 'Compris', exact: true }).click({ timeout: 5000 }).catch(() => undefined);
  await page.mouse.move(640, 400);
  for (let step = 0; step < zoomOut; step++) await page.mouse.wheel(0, 100);
  await page.waitForTimeout(3000);
}

test('dense city', async ({ page }) => {
  await openCity(page, 'denseCity', [64, 64], 4);
  await expect(page).toHaveScreenshot('dense-city.png', { mask: [page.locator('.game-clock')] });
});

test('map edge', async ({ page }) => {
  await openCity(page, 'cornerCity', [6, 6], 3);
  await expect(page).toHaveScreenshot('map-edge.png', { mask: [page.locator('.game-clock')] });
});

test('open build menu', async ({ page }) => {
  await openCity(page, 'denseCity', [64, 64], 4);
  await page.getByRole('button', { name: 'Construire', exact: true }).click();
  await page.getByRole('button', { name: 'Énergie et eau', exact: true }).click();
  await expect(page.locator('[data-codex-id="coalPlant"]')).toBeVisible();
  await page.addStyleTag({ content: 'canvas { visibility: hidden !important }' });
  await page.waitForTimeout(1500);
  await expect(page).toHaveScreenshot('build-menu.png');
});

test('venue interior', async ({ page }) => {
  await openCity(page, 'denseCity', [64, 64], 4);
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { venueStore } = await import('../src/store/venueStore.ts');
    const { venueCity } = await import('../scripts/visualScenes.ts');
    const { state, venueId } = venueCity();
    gameStore.getState().replaceState(state);
    venueStore.getState().open(venueId);
  });
  await page.waitForTimeout(3000);
  await expect(page).toHaveScreenshot('venue.png', { mask: [page.locator('.game-clock')] });
});
