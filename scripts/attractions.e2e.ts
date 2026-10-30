import { expect, test } from '@playwright/test';

test.describe('attractions', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a Museum earns Takings that the player collects', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    const before = await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'attraction-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, buildings: [createBuilding(50, 'masMuseum', 64, 64, 0)], nextId: 51 });
      gameStore.getState().send({ type: 'SkipTime', hours: 6 });
      uiStore.getState().select(50);
      return gameStore.getState().state.urbs;
    });
    await expect(page.getByRole('radiogroup', { name: 'Ticket' })).toBeVisible();
    await page.getByRole('radio').nth(2).click();
    await expect(page.getByRole('radio').nth(2)).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio').nth(1).click();
    const badge = page.locator('.collect-badge');
    await expect(badge).toHaveCount(1);
    const collect = page.getByRole('button', { name: /Takings/ });
    await expect(collect).toBeEnabled();
    await collect.click();
    const after = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.urbs);
    expect(after).toBeGreaterThan(before);
    await expect(collect).toBeDisabled();
    await expect(badge).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('shows', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the player schedules a Show in the Concert hall and gets a toast when it starts', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'show-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [createBuilding(50, 'concertHall', 64, 64, 0), createBuilding(51, 'home', 60, 64, 0)], nextId: 52 });
      uiStore.getState().select(50);
    });
    await page.getByRole('button', { name: /Schedule a Show/ }).click();
    await expect(page.getByText(/Show scheduled/)).toBeVisible();
    const urbs = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.urbs);
    expect(urbs).toBeLessThan(100_000);
    await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().send({ type: 'SkipTime', hours: 2 }));
    await expect(page.getByText('A Gathering has started.')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('football club', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the player founds a Club, sets the lineup and plays a Match', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
      localStorage.setItem('urbtopia-flags', JSON.stringify({ clubs: true }));
    });
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'club-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [createBuilding(50, 'footballStadium', 64, 64, 0), createBuilding(51, 'home', 56, 64, 0)], nextId: 52 });
      uiStore.getState().select(50);
    });
    await page.getByRole('button', { name: 'Found a Club' }).click();
    await page.getByRole('button', { name: 'Manage the Club' }).click();
    const dialog = page.getByRole('dialog', { name: 'Club management' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('tab', { name: /Lineup/ }).click();
    await dialog.getByRole('radio', { name: '4-3-3' }).click();
    await expect(dialog.getByRole('radio', { name: '4-3-3' })).toHaveAttribute('aria-checked', 'true');
    await dialog.getByRole('tab', { name: /Recruitment/ }).click();
    await dialog.getByRole('button', { name: /Sign/ }).first().click();
    await dialog.getByRole('tab', { name: /Squad/ }).click();
    await expect(dialog.getByRole('list', { name: 'Squad' }).locator('li')).toHaveCount(19);
    await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().send({ type: 'SkipTime', hours: 7 }));
    await dialog.getByRole('tab', { name: /^Match/ }).click();
    const pitch = dialog.getByRole('img', { name: 'Pitch: the players and the ball' });
    await expect(pitch).toBeVisible();
    await expect(pitch.locator('.club-pitch__player')).toHaveCount(22);
    const ballAt = () => pitch.locator('.club-pitch__ball').evaluate(element => getComputedStyle(element).transform);
    const kickOff = await ballAt();
    await dialog.getByRole('button', { name: 'Play', exact: true }).click();
    await expect.poll(ballAt).not.toBe(kickOff);
    await pitch.screenshot({ path: process.env.PITCH_SHOT ?? 'test-results/pitch.png' });
    await dialog.getByRole('button', { name: 'Skip to the end' }).click();
    await expect(dialog.getByText('Minute 90')).toBeVisible();
    await dialog.getByRole('tab', { name: /Championship/ }).click();
    await expect(dialog.getByRole('table')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('baseball club', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the player founds a baseball Club, picks the best lineup and plays a Match', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
      localStorage.setItem('urbtopia-flags', JSON.stringify({ clubs: true }));
    });
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'baseball-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [createBuilding(50, 'baseballField', 64, 64, 0), createBuilding(51, 'home', 56, 64, 0)], nextId: 52 });
      uiStore.getState().select(50);
    });
    await page.getByRole('button', { name: 'Found a Club' }).click();
    await page.getByRole('button', { name: 'Manage the Club' }).click();
    const dialog = page.getByRole('dialog', { name: 'Club management' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('tab', { name: /Lineup/ }).click();
    await dialog.getByRole('radio', { name: 'Power' }).click();
    await expect(dialog.getByRole('radio', { name: 'Power' })).toHaveAttribute('aria-checked', 'true');
    await dialog.getByRole('button', { name: 'Pick the best lineup' }).click();
    await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().send({ type: 'SkipTime', hours: 7 }));
    await dialog.getByRole('tab', { name: /^Match/ }).click();
    const field = dialog.getByRole('img', { name: 'Field: the fielders, the runners and the ball' });
    await expect(field).toBeVisible();
    await expect(field.locator('.club-field__player')).toHaveCount(9);
    const ballAt = () => field.locator('.club-field__ball').evaluate(element => getComputedStyle(element).transform);
    const first = await ballAt();
    await dialog.getByRole('button', { name: 'Play', exact: true }).click();
    await expect.poll(ballAt, { timeout: 15_000 }).not.toBe(first);
    await field.screenshot({ path: process.env.FIELD_SHOT ?? 'test-results/field.png' });
    await dialog.getByRole('button', { name: 'Change pitcher' }).first().click();
    await dialog.getByRole('button', { name: 'Skip to the end' }).click();
    await expect(dialog.getByText(/^Inning (9|1[0-2])$/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Record the decisions' }).click();
    await expect(dialog.getByText('Decisions recorded for the Match.')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('feature flags', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the Clubs are off until the devtools switch them on', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
    await page.goto('/?e2e');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding } = await import('../src/core/index.ts');
      const state = newGame({ seed: 'flag-e2e', now: Date.now() });
      gameStore.getState().replaceState({ ...state, urbs: 100_000, buildings: [createBuilding(50, 'footballStadium', 64, 64, 0), createBuilding(51, 'home', 56, 64, 0)], nextId: 52 });
      uiStore.getState().select(50);
    });
    await expect(page.getByRole('radiogroup', { name: 'Ticket' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Found a Club' })).toHaveCount(0);
    await page.getByRole('button', { name: 'DEV' }).click();
    await page.getByRole('checkbox', { name: 'Gestion des clubs' }).check();
    await expect(page.getByRole('button', { name: 'Found a Club' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('urbtopia-flags'))).toBe('{"clubs":true}');
    await page.reload();
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
    await page.getByRole('button', { name: 'DEV' }).click();
    await expect(page.getByRole('checkbox', { name: 'Gestion des clubs' })).toBeChecked();
    expect(errors).toEqual([]);
  });
});
