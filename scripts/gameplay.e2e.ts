import { expect, test } from '@playwright/test';

for (const touch of [false, true]) {
  test.describe(touch ? 'touch selection' : 'mouse selection', () => {
    test.use({ hasTouch: touch, isMobile: touch, viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
    test('selecting a Storehouse does not click through to its sale button', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
      await page.goto('/');
      await expect(page.locator('#splash')).toHaveCount(0);
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { uiStore } = await import('../src/store/uiStore.ts');
        const { newGame, createBuilding } = await import('../src/core/index.ts');
        const state = newGame({ seed: 'storehouse-selection', now: Date.now() });
        gameStore.getState().replaceState({ ...state, buildings: [createBuilding(50, 'storehouse', 64, 64, 0)], nextId: 51 });
        uiStore.getState().select(50);
      });
      const sell = page.locator('.side-panel-actions button').last();
      await expect(sell).toBeVisible();
      const bounds = (await sell.boundingBox())!;
      const target = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      await page.evaluate(async target => {
        const { uiStore } = await import('../src/store/uiStore.ts');
        const { sceneHandle } = await import('../src/store/sceneHandle.ts');
        uiStore.getState().select(null);
        const scene = sceneHandle.current!;
        scene.camera.focusOn(65, 65);
        const base = scene.project(65, .4, 65);
        scene.camera.focusOn(66, 65);
        const dx = scene.project(65, .4, 65);
        scene.camera.focusOn(65, 66);
        const dz = scene.project(65, .4, 65);
        const ax = dx.x - base.x, ay = dx.y - base.y, bx = dz.x - base.x, by = dz.y - base.y;
        const tx = target.x - base.x, ty = target.y - base.y;
        const determinant = ax * by - bx * ay;
        scene.camera.focusOn(65 + (tx * by - bx * ty) / determinant, 65 + (ax * ty - tx * ay) / determinant);
      }, target);
      await expect(page.locator('.side-panel')).toHaveCount(0);
      if (touch) await page.touchscreen.tap(target.x, target.y);
      else await page.mouse.click(target.x, target.y);
      await expect(page.locator('.side-panel')).toContainText('Entrepôt');
      await expect(page.getByText(/^Vendre ce bâtiment \?/)).toHaveCount(0);
      const pending = await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().pendingSaleId);
      expect(pending).toBeNull();
      await sell.click();
      await expect(page.getByText(/^Vendre ce bâtiment \?/)).toBeVisible();
    });

    test('coal controls, upgrades, local pollution and saved choices work in the city UI', async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout: 'C' })));
      await page.goto('/');
      await expect(page.locator('#splash')).toHaveCount(0);
      await page.getByRole('button', { name: 'Passer le didacticiel', exact: true }).click();
      await page.getByRole('button', { name: 'Passer', exact: true }).click();
      await page.getByRole('button', { name: 'Construire', exact: true }).click();
      await page.getByRole('button', { name: 'Énergie et eau', exact: true }).click();
      await expect(page.locator('[data-codex-id="coalPlant"]')).toBeVisible();
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { uiStore } = await import('../src/store/uiStore.ts');
        const { newGame, createBuilding } = await import('../src/core/index.ts');
        const state = newGame({ seed: 'coal-ui', now: Date.now() });
        gameStore.getState().replaceState({ ...state, urbs: 10000, buildings: [createBuilding(50, 'coalPlant', 64, 64, 0), { ...createBuilding(51, 'home', 60, 64, 0), tier: 8 }], nextId: 52, adaptationUntil: 0 });
        uiStore.setState({ flyout: null });
        uiStore.getState().select(50);
      });
      const panel = page.locator('.side-panel');
      await expect(panel.getByRole('heading', { name: 'Centrale à charbon', exact: true })).toBeVisible();
      const toggle = panel.getByRole('switch', { name: 'Production au charbon activée', exact: true });
      await expect(toggle).toBeChecked();
      await toggle.click();
      await expect(toggle).not.toBeChecked();
      await expect(panel).toContainText('Électricité fournie par le charbon: 0.00');
      await toggle.click();
      await expect(toggle).toBeChecked();
      for (const tier of [2, 3, 4]) {
        await panel.getByRole('button', { name: `Améliorer → ${tier}`, exact: true }).click();
        await expect(panel.getByRole('heading', { name: `Niveau ${tier}`, exact: true })).toBeVisible();
      }
      await expect(panel).toContainText('Unités nominales/heure: 64');
      await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().select(null));
      await page.locator('[data-action="stats"]').click();
      const stats = page.getByRole('dialog', { name: /^Gestion de la ville/ });
      await expect(stats).toContainText('Électricité fournie par le charbon');
      await expect(stats).toContainText('Malus local de bien-être du charbon');
      await stats.getByRole('button', { name: 'Fermer', exact: true }).click();
      await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().select(50));
      await toggle.click();
      await page.evaluate(async () => {
        const { gameStore } = await import('../src/store/gameStore.ts');
        const { saveSession } = await import('../src/persistence/instance.ts');
        saveSession.save(gameStore.getState().state, Date.now());
      });
      await page.reload();
      await expect(page.locator('#splash')).toHaveCount(0);
      await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().select(50));
      await expect(toggle).not.toBeChecked();
      await expect(panel.getByRole('heading', { name: 'Niveau 4', exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('coal-tier-four.png') });
      expect(errors).toEqual([]);
    });
  });
}

for (const layout of ['B', 'C']) {
  test(`city management shortcut opens from layout ${layout} navigation`, async ({ page }) => {
    await page.addInitScript(layout => localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout })), layout);
    await page.goto('/');
    await expect(page.locator('#splash')).toHaveCount(0);
    if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
    const shortcut = page.locator('[data-action="stats"]');
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveAccessibleName('Gestion de la ville');
    await expect(shortcut.locator('img')).toHaveAttribute('src', /\/assets\/icons\/town-management\.png$/);
    await expect(shortcut.locator('img')).toHaveJSProperty('complete', true);
    expect(await shortcut.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await shortcut.click();
    const stats = page.getByRole('dialog', { name: /^Gestion de la ville/ });
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('Électricité fournie par le charbon');
    await stats.getByRole('button', { name: 'Fermer', exact: true }).click();
    await expect(stats).toHaveCount(0);
  });
}
