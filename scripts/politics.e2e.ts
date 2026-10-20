import { expect, test } from '@playwright/test';

const DAY_MS = 24 * 3_600_000;

test.describe('politics', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('an ignored Petition escalates into a Demonstration that lowers the Approval', async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
    await page.goto('/?bypass-tutorial&keep-local');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });

    const before = await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { uiStore } = await import('../src/store/uiStore.ts');
      const { newGame, createBuilding, withPolitics, approvalOf } = await import('../src/core/index.ts');
      const now = Date.now();
      const start = newGame({ seed: 'demonstration', now, difficulty: 'medium' });
      const home = { ...createBuilding(start.nextId, 'home', 56, 59, 0), tier: 8 };
      const hall = createBuilding(start.nextId + 1, 'townHall', 64, 60, 0);
      const city = withPolitics({ ...start, adaptationUntil: 0, urbs: 10_000, nextId: start.nextId + 2, buildings: [...start.buildings, home, hall] });
      const politics = city.politics!;
      const petition = { id: 1, cause: 'electricity' as const, parcel: { x: 3, y: 3 }, since: politics.day - 3, escalated: false };
      gameStore.getState().replaceState({ ...city, politics: { ...politics, adaptationUntilDay: 0, petitions: [petition], nextPetitionId: 2 } });
      uiStore.getState().openPolitics();
      return approvalOf(gameStore.getState().state);
    });

    const window = page.getByRole('dialog', { name: 'Politique' });
    await expect(window).toBeVisible();
    const petitions = window.locator('#politics-petitions');
    await expect(petitions).toContainText('Manque : Électricité');
    await expect(petitions).not.toContainText('Manifestation');
    await page.screenshot({ path: testInfo.outputPath('1-petition-ignored.png') });

    await page.evaluate(async (dayMs) => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { advance } = await import('../src/core/index.ts');
      const state = gameStore.getState().state;
      gameStore.getState().replaceState(advance(state, state.lastSeen + dayMs).state);
    }, DAY_MS);

    await expect(petitions).toContainText('Manifestation');
    await expect(window.locator('#politics-summary')).toContainText('Manifestations');
    await expect(window.locator('#politics-summary')).toContainText('Manifestation : Électricité');
    const after = await page.evaluate(async () => {
      const { gameStore } = await import('../src/store/gameStore.ts');
      const { approvalOf } = await import('../src/core/index.ts');
      return approvalOf(gameStore.getState().state);
    });
    expect(after!).toBeLessThan(before!);
    await page.screenshot({ path: testInfo.outputPath('2-demonstration.png') });
  });
});
