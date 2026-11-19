import { expect, test } from '@playwright/test';

test.describe('district plan', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the player plays a whole game of the District plan and gets the Rank of its score', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => message.type() === 'error' && errors.push(message.text()));
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', taxBadgeThreshold: 1, layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'district-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, buildings: [createBuilding(50, 'planningOffice', 64, 64, 0)], nextId: 51 });
      uiStore.getState().select(50);
    });

    await page.getByRole('button', { name: 'Open the District plan' }).click();
    await expect(page.getByRole('heading', { name: 'District plan' })).toBeVisible();
    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByText('Hexes left').locator('xpath=following-sibling::strong')).toHaveText('23');

    // The first Hex goes where the player taps: the cell east of the Start hex, wherever the isometric view puts it.
    const tap = await page.evaluate(async () => {
      const { districtSceneHandle } = await import('../src/store/districtSceneHandle.ts');
      const canvas = document.querySelector('[data-testid="district-board"] canvas')!.getBoundingClientRect();
      const centre = districtSceneHandle.current!.screenCenterOf({ q: 1, r: 0 });
      return { x: canvas.left + centre.x, y: canvas.top + centre.y };
    });
    await page.mouse.click(tap.x, tap.y);
    await expect(page.getByRole('button', { name: 'Place' })).toBeEnabled();
    await page.getByRole('button', { name: 'Turn', exact: true }).click();
    await page.getByRole('button', { name: 'Turn the other way' }).click();
    await page.getByRole('button', { name: 'Turn', exact: true }).click();
    await page.getByRole('button', { name: 'Place' }).click();
    await expect(page.getByText('Hexes left').locator('xpath=following-sibling::strong')).toHaveText('22');

    // Undo takes the Hex back, and the player places it again.
    await page.getByRole('button', { name: 'Take back the last Hex' }).click();
    await expect(page.getByText('Hexes left').locator('xpath=following-sibling::strong')).toHaveText('23');
    await page.mouse.click(tap.x, tap.y);
    await page.getByRole('button', { name: 'Place' }).click();
    await expect(page.getByText('Hexes left').locator('xpath=following-sibling::strong')).toHaveText('22');

    // The others are picked in the store, so the test does not depend on the pixels of the board.
    for (let left = 22; left > 0; left--) {
      await page.evaluate(async () => {
        const core = await import('../src/core/index.ts');
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { districtStore } = await import('../src/store/districtStore.ts');
        const state = gameStore.getState().state;
        const office = state.buildings.find(building => building.id === 50)!;
        const board = core.districtBoardOf({ seed: state.seed, officeId: 50 }, office.district!.game!);
        districtStore.getState().selectCell(core.cellsOfBoard(core.DISTRICT_PLAN.boardRadius).find(cell => core.isDistrictPlacementValid(board, cell))!);
      });
      await page.getByRole('button', { name: 'Place' }).click();
    }

    await expect(page.getByText(/Game over/)).toBeVisible();
    const { score, rank } = await page.evaluate(async () => {
      const core = await import('../src/core/index.ts');
      const { gameStore } = await import('../src/store/gameStore.ts');
      const best = gameStore.getState().state.buildings.find(building => building.id === 50)!.district!.best!;
      return { score: best.score, rank: core.districtRankOf(best.score, best.game.deckSize) ?? null };
    });
    const expected = rank === null ? 'None yet' : rank.charAt(0).toUpperCase() + rank.slice(1);
    await expect(page.getByText('Rank').locator('xpath=following-sibling::strong')).toHaveText(expected);
    await expect(page.getByText('Best').locator('xpath=following-sibling::strong')).toContainText(String(score));
    expect(errors).toEqual([]);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'District plan' })).toHaveCount(0);
  });
});
