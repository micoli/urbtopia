import { expect, test, type Page } from '@playwright/test';

async function openLandMenu(page: Page) {
  await page.getByRole('button', { name: 'Not now', exact: true }).click({ timeout: 500 }).catch(() => {});
  await page.locator('[data-action="parcels"]').click();
}

test.describe('knowledge', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('shows the Knowledge layer and the Codex page of a schooled city', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (localStorage.getItem('urbtopia-prefs')) return;
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'A' }));
    });
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'knowledge-ui', now: Date.now() });
      gameStore.getState().replaceState({
        ...state, urbs: 1_000_000, nextId: 200,
        buildings: [...state.buildings, createBuilding(101, 'school', 52, 50, 0), { ...createBuilding(102, 'library', 56, 50, 0), tier: 3 },
          ...[54, 58].map((x, index) => ({ ...createBuilding(103 + index, 'home', x, 54, 0), tier: 3 }))],
      });
      const { sceneHandle } = await import('../src/store/sceneHandle.ts');
      sceneHandle.current?.focusOnTile({ x: 56, y: 54 });
    });

    await openLandMenu(page);
    const toggle = page.locator('#land-data-toggle');
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    await page.locator('#land-data').getByRole('button', { name: 'Knowledge', exact: true }).click();
    await expect(page.locator('.analytics-current .analytics-hud-title')).toHaveText('Knowledge');
    await page.screenshot({ path: 'test-results/gameplay/knowledge-layer.png' });
    await page.keyboard.press('Escape');
    await expect(page.locator('.analytics-hud')).toHaveCount(0);

    await page.evaluate(async () => {
      const { uiStore } = await import('../src/store/uiStore.ts');
      uiStore.getState().openCodex(undefined, 'knowledge');
    });
    await expect(page.locator('.codex-detail .codex-entry-name')).toHaveText('Knowledge');
    await expect(page.locator('.codex-detail table').first()).toContainText('Library, Tier 5');
    expect(errors).toEqual([]);
  });
});
