import { expect, test, type Locator, type Page } from '@playwright/test';

async function openHousing(panel: Locator) {
  const housing = panel.getByRole('button', { name: 'Housing' });
  if ((await housing.getAttribute('aria-expanded')) === 'false') await housing.click();
}

async function stateSummary(page: Page) {
  return page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const state = gameStore.getState().state;
    return { replanning: state.replan !== undefined, buildings: state.buildings.length, roads: state.roads.length, stashed: state.replan?.stash.buildings.length ?? 0, urbs: state.urbs };
  });
}

test('a City is replanned from its Cities row: lifted into the Stash, cancelled, then laid out again and finished', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('urbtopia-flags', JSON.stringify({ replan: true }));
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
  });
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { newGame, createBuilding } = await import('../src/core/index.ts');
    const base = newGame({ seed: 'replan-e2e', now: Date.now() });
    gameStore.getState().replaceState({
      ...base, tutorial: null, adaptationUntil: 0, urbs: 5000, nextId: 600,
      roads: [{ x: 60, y: 60, kind: 'road' }, { x: 61, y: 60, kind: 'road' }, { x: 62, y: 60, kind: 'road', tier: 2 }],
      buildings: [{ ...createBuilding(500, 'home', 56, 57, 0), tier: 2 }, createBuilding(501, 'workshop', 66, 57, 0)],
    });
  });
  const before = await stateSummary(page);

  await page.locator('[data-action="stats"]').click();
  await page.getByRole('tab', { name: 'Cities' }).click();
  await page.getByRole('button', { name: 'Replan', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Replan', exact: true }).click();

  const panel = page.getByRole('complementary', { name: 'Replan' });
  await expect(panel).toBeVisible();
  expect(await stateSummary(page)).toMatchObject({ replanning: true, buildings: 0, roads: 0, stashed: 2, urbs: before.urbs });
  await expect(panel.getByRole('heading', { name: 'Network' })).toBeVisible();
  await openHousing(panel);
  await expect(panel.getByRole('button', { name: /Home/ }).first()).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Finish', exact: true })).toBeDisabled();
  await page.locator('[data-action="stats"]').click({ trial: true });
  await panel.getByRole('button', { name: 'Cancel Replan', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel Replan', exact: true }).click();
  await expect(panel).toHaveCount(0);
  expect(await stateSummary(page)).toEqual({ ...before, replanning: false });

  await page.locator('[data-action="stats"]').click();
  await page.getByRole('tab', { name: 'Cities' }).click();
  await page.getByRole('button', { name: 'Replan', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Replan', exact: true }).click();
  await expect(panel).toBeVisible();
  await openHousing(panel);
  await panel.getByRole('button', { name: /Home/ }).first().click();
  expect(await page.evaluate(async () => {
    const { uiStore } = await import('../src/store/uiStore.ts');
    uiStore.getState().cancelTool();
    uiStore.getState().tapTile({ x: 66, y: 57 });
    return uiStore.getState().selectedBuildingId;
  })).toBeNull();
  await panel.getByRole('button', { name: /Home/ }).first().click();
  await page.evaluate(async () => {
    const { uiStore } = await import('../src/store/uiStore.ts');
    uiStore.getState().hoverTile({ x: 60, y: 62 });
    uiStore.getState().confirm();
    uiStore.getState().cancelTool();
    const { gameStore } = await import('../src/store/gameStore.ts');
    const send = gameStore.getState().send;
    send({ type: 'Replan', action: { kind: 'placeBuilding', id: 501, x: 70, y: 62, rotation: 0 } });
    send({ type: 'Replan', action: { kind: 'placeTiles', layer: 'roads', tiles: [{ x: 50, y: 50 }, { x: 51, y: 50 }] } });
    send({ type: 'Replan', action: { kind: 'placeTiles', layer: 'roads', tiles: [{ x: 52, y: 50 }], tier: 2 } });
  });
  await expect(panel.getByRole('button', { name: 'Finish', exact: true })).toBeEnabled();
  await panel.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(panel).toHaveCount(0);
  const summary = page.getByRole('dialog');
  await expect(summary).toContainText('Replan finished');
  await expect(summary).toContainText('no road');
  await summary.getByRole('button', { name: 'OK' }).click();
  await expect(summary).toHaveCount(0);
  expect(await stateSummary(page)).toEqual({ ...before, replanning: false });
  expect(errors).toEqual([]);
});
