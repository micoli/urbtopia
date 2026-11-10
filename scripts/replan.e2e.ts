import { expect, test, type Locator, type Page } from '@playwright/test';

// The Replan button closes the window and arms the zone tool: two corners start it.
async function drawZone(page: Page) {
  await expect(page.locator('.city-management-backdrop')).toHaveCount(0);
  await page.evaluate(async () => {
    const { uiStore } = await import('../src/store/uiStore.ts');
    uiStore.getState().setPointerKind('mouse');
    uiStore.getState().hoverTile({ x: 48, y: 48 });
    uiStore.getState().confirm();
    uiStore.getState().hoverTile({ x: 65, y: 65 });
    uiStore.getState().confirm();
  });
}

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
  await drawZone(page);

  const panel = page.getByRole('complementary', { name: 'Replan' });
  await expect(panel).toBeVisible();
  expect(await stateSummary(page)).toMatchObject({ replanning: true, buildings: 1, roads: 0, stashed: 1, urbs: before.urbs });
  await expect(panel.getByRole('heading', { name: 'Network' })).toBeVisible();
  await panel.getByRole('button', { name: 'Hide the Stash' }).click();
  await expect(panel.getByRole('heading', { name: 'Network' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Cancel Replan', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Show the Stash' }).click();
  const network = panel.getByRole('button', { name: 'Network', exact: true });
  await expect(network).toHaveAttribute('aria-expanded', 'true');
  await network.click();
  await expect(panel.locator('[aria-expanded="true"]:not([aria-label])')).toHaveCount(0);
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
  await drawZone(page);
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

test('a long press on a Stash item drops it for its price or puts it off to the Later section', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    localStorage.setItem('urbtopia-flags', JSON.stringify({ replan: true }));
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
  });
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { gameStore } = await import('../src/store/gameStore.ts');
    const { newGame, createBuilding } = await import('../src/core/index.ts');
    const base = newGame({ seed: 'replan-drop', now: Date.now() });
    gameStore.getState().replaceState({
      ...base, tutorial: null, adaptationUntil: 0, urbs: 5000, nextId: 600,
      roads: [{ x: 60, y: 60, kind: 'road' }],
      buildings: [{ ...createBuilding(500, 'home', 56, 57, 0), tier: 2 }, createBuilding(501, 'workshop', 66, 57, 0)],
    });
    await gameStore.getState().send({ type: 'StartReplan' });
  });
  const panel = page.getByRole('complementary', { name: 'Replan' });
  await openHousing(panel);
  const home = panel.getByRole('button', { name: /Home/ }).first();
  const box = (await home.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  const menu = panel.getByRole('menu');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Later' }).click();
  await expect(panel.getByRole('button', { name: 'Later', exact: true })).toBeVisible();

  await panel.getByRole('button', { name: 'Later', exact: true }).click();
  await panel.getByRole('button', { name: /Home/ }).first().click({ button: 'right' });
  await panel.getByRole('menuitem', { name: 'Back to Housing' }).click();
  await expect(panel.getByRole('button', { name: 'Later', exact: true })).toHaveCount(0);
  await openHousing(panel);
  await panel.getByRole('button', { name: /Home/ }).first().click({ button: 'right' });
  await panel.getByRole('menuitem', { name: 'Later' }).click();
  const before = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.urbs);
  await panel.getByRole('button', { name: 'Later', exact: true }).click();
  const laterHome = panel.getByRole('button', { name: /Home/ }).first();
  await laterHome.click({ button: 'right' });
  await panel.getByRole('menuitem', { name: /Drop and get/ }).click();
  const after = await page.evaluate(async () => {
    const state = (await import('../src/store/gameStore.ts')).gameStore.getState().state;
    return { urbs: state.urbs, homes: state.replan!.stash.buildings.filter((building) => building.type === 'home').length };
  });
  expect(after.homes).toBe(0);
  expect(after.urbs).toBeGreaterThan(before);
});
