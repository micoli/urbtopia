import { expect, test, type Page } from '@playwright/test';

const MOVEMENT = ['Piétons', 'Voitures', 'Tous'];
const DATA = ['Bien-être', 'Pollution', 'Congestion', 'Rayon des odeurs', 'Valeur du terrain'];

async function openLandMenu(page: Page) {
  await page.getByRole('button', { name: 'Pas maintenant', exact: true }).click({ timeout: 500 }).catch(() => {});
  await page.locator('[data-action="parcels"]').click();
}

async function expandSection(page: Page, id: 'land-movement' | 'land-data' | 'land-coverage') {
  const toggle = page.locator(`#${id}-toggle`);
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

test.describe('analytics view', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('opens every layer from the Land menu and leaves with Escape', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (localStorage.getItem('urbtopia-prefs')) return;
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'A' }));
    });
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'analytics-ui', now: Date.now() });
      gameStore.getState().replaceState({
        ...state, urbs: 1_000_000, nextId: 200,
        buildings: [...state.buildings, createBuilding(101, 'school', 52, 50, 0), createBuilding(102, 'coalPlant', 70, 70, 0), { ...createBuilding(103, 'home', 56, 59, 0), tier: 3, taxCitizenMs: 100_000_000 },
          ...[54, 56, 58].map((x, index) => ({ ...createBuilding(104 + index, 'home', x, 50, 0), tier: 3, taxCitizenMs: 100_000_000 }))],
      });
      const { sceneHandle } = await import('../src/store/sceneHandle.ts');
      sceneHandle.current?.focusOnTile({ x: 58, y: 53 });
    });
    await expect(page.locator('.collect-badge').first()).toBeVisible();

    await openLandMenu(page);
    await expect(page.getByRole('button', { name: 'Achat de parcelle', exact: true }).first()).toBeVisible();
    for (const layer of MOVEMENT) {
      await expandSection(page, 'land-movement');
      await page.locator('#land-movement').getByRole('button', { name: layer, exact: true }).click();
      await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText(layer);
      await expect(page.locator('[data-action="parcels"]')).toHaveCount(0);
      await expect(page.locator('.collect-badge, .sanction-badge, .working-indicator, .parcel-tag')).toHaveCount(0);
      if (layer === 'Piétons') {
        await expect(page.locator('.analytics-flow-list').first()).toBeVisible();
        await page.locator('.analytics-flow-list button').first().click();
        await expect(page.locator('.locator-arrow')).toBeVisible();
        await page.screenshot({ path: '/private/tmp/claude-501/-Users-omichaud-src-urbix/6c16ae93-ff53-4af6-ac83-89ad530b2d14/scratchpad/flows.png' });
        await page.getByRole('button', { name: 'Analytique suivante', exact: true }).click();
        await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText('Voitures');
        await page.getByRole('button', { name: 'Analytique précédente', exact: true }).click();
        await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText('Piétons');
      }
      await page.keyboard.press('Escape');
      await expect(page.locator('.analytics-hud')).toHaveCount(0);
      await expect(page.locator('.collect-badge').first()).toBeVisible();
      await openLandMenu(page);
    }
    for (const layer of DATA) {
      await expandSection(page, 'land-data');
      await page.locator('#land-data').getByRole('button', { name: layer, exact: true }).click();
      await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText(layer);
      await page.keyboard.press('Escape');
      await expect(page.locator('.analytics-hud')).toHaveCount(0);
      await openLandMenu(page);
    }

    await expandSection(page, 'land-coverage');
    await page.locator('#land-coverage').getByRole('button', { name: 'Éducation', exact: true }).click();
    await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText('Couverture des services · Éducation');
    await expect(page.locator('.analytics-current .analytics-legend-state')).toHaveCount(3);
    await page.getByRole('button', { name: 'Sortir', exact: true }).click();
    await expect(page.locator('.analytics-hud')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
