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
    const collect = page.getByRole('button', { name: /Takings/ });
    await expect(collect).toBeEnabled();
    await collect.click();
    const after = await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.urbs);
    expect(after).toBeGreaterThan(before);
    await expect(collect).toBeDisabled();
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
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' })));
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
    await dialog.getByRole('button', { name: 'Skip to the end' }).click();
    await expect(dialog.getByText('Minute 90')).toBeVisible();
    await dialog.getByRole('tab', { name: /Championship/ }).click();
    await expect(dialog.getByRole('table')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
