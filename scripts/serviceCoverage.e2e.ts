import { expect, test, type Page } from '@playwright/test';

async function renderedHomeColors(page: Page) {
  return page.evaluate(async () => {
    const { sceneHandle } = await import('../src/store/sceneHandle.ts');
    const scene = sceneHandle.current as unknown as { serviceCoverageLayer: { root: import('three').Group } };
    const counts = { green: 0, red: 0 };
    if (!scene.serviceCoverageLayer.root.visible) return counts;
    scene.serviceCoverageLayer.root.traverse(object => {
      const mesh = object as import('three').InstancedMesh;
      if (!mesh.isInstancedMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const color = (materials[0] as import('three').MeshStandardMaterial).color?.getHex();
      if (color === 0x35d07f) counts.green += mesh.count;
      if (color === 0xe5484d) counts.red += mesh.count;
    });
    return counts;
  });
}

for (const layout of ['A', 'B', 'C'] as const) {
  for (const touch of [false, true]) {
    test.describe(`service coverage ${layout} ${touch ? 'mobile' : 'desktop'}`, () => {
      test.use({ hasTouch: touch, isMobile: touch, viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 900 } });

      test('filters actual coverage, remains active while building and remembers the type after reload', async ({ page }, testInfo) => {
        test.setTimeout(60_000);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(layout => {
          if (localStorage.getItem('urbtopia-prefs')) return;
          localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'fr', layout }));
        }, layout);
        await page.goto('/?e2e');
        await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
        await page.evaluate(async () => {
          const { gameStore } = await import('../src/store/gameStore.ts');
          const { newGame, createBuilding } = await import('../src/core/index.ts');
          const state = newGame({ seed: 'service-coverage-ui', now: Date.now() });
          gameStore.getState().replaceState({
            ...state, urbs: 1_000_000, nextId: 20,
            buildings: [createBuilding(1, 'school', 52, 50, 0),
              ...[54, 56, 58, 60].map((x, index) => ({ ...createBuilding(2 + index, 'home', x, 50, 0), tier: 6, taxCitizenMs: 100_000_000 })),
              createBuilding(6, 'home', 95, 50, 0),
              { ...createBuilding(7, 'waterTower', 70, 70, 0), tier: 3 },
              { ...createBuilding(8, 'waterTower', 72, 70, 0), tier: 3 }],
          });
          const { sceneHandle } = await import('../src/store/sceneHandle.ts');
          sceneHandle.current?.focusOnTile({ x: 58, y: 53 });
        });
        await expect(page.locator('.collect-badge').first()).toBeVisible();
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
        await page.locator('[data-action="stats"]').click();
        await page.getByRole('button', { name: 'Voir la couverture des services', exact: true }).click();
        await expect(page.locator('.eco-dashboard')).toHaveCount(0);
        const panel = page.getByRole('region', { name: 'Couverture des services', exact: true });
        const selector = panel.getByRole('combobox', { name: 'Type de service public' });
        await expect(selector).toHaveText('École▾');
        await expect(page.locator('.collect-badge, .sanction-badge, .working-indicator, .parcel-tag')).toHaveCount(0);
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 2, red: 3 });
        await selector.click();
        await expect(panel.getByRole('option')).toHaveCount(15);
        await expect(panel.getByRole('group')).toHaveCount(6);
        await panel.getByRole('option', { name: 'Commissariat', exact: true }).click();
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 0, red: 5 });
        await selector.click();
        await panel.getByRole('option', { name: 'École', exact: true }).click();
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 2, red: 3 });
        await page.screenshot({ path: testInfo.outputPath('service-coverage.png') });

        await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().select(1));
        await page.getByRole('button', { name: 'Améliorer → 2', exact: true }).click();
        await page.getByRole('button', { name: 'Améliorer → 3', exact: true }).click();
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 4, red: 1 });
        await expect(panel).toBeVisible();
        await selector.click();
        await selector.press('ArrowDown');
        await selector.press('Enter');
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 0, red: 5 });
        await selector.click();
        await panel.getByRole('option', { name: 'École', exact: true }).click();
        await page.evaluate(async () => {
          const { uiStore } = await import('../src/store/uiStore.ts');
          const { gameStore } = await import('../src/store/gameStore.ts');
          const { evaluateTool } = await import('../src/tools/tools.ts');
          const state = gameStore.getState().state;
          const tool = { kind: 'building', buildingType: 'school' } as const;
          const issues = new Set<string>();
          for (let y = 48; y < 64; y++) {
            for (let x = 48; x < 64; x++) {
              const evaluation = evaluateTool(tool, { state, tile: { x, y }, rotation: null });
              if (!evaluation.valid) {
                issues.add(String(evaluation.issue));
                continue;
              }
              uiStore.getState().chooseTool(tool);
              uiStore.getState().setPointerKind('touch');
              uiStore.getState().pinTile({ x, y });
              return;
            }
          }
          throw new Error(`No valid school placement: ${[...issues].join(', ')}; parcels ${JSON.stringify(state.ownedParcels)}`);
        });
        await expect(page.locator('.confirm-pad')).toBeVisible();
        await expect(selector).toBeVisible();
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 4, red: 1 });
        await page.screenshot({ path: testInfo.outputPath('service-coverage-placement.png') });
        await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
        await expect.poll(() => page.evaluate(async () => {
          const { gameStore } = await import('../src/store/gameStore.ts');
          return gameStore.getState().state.buildings.filter(building => building.type === 'school').length;
        })).toBe(2);
        await expect(panel).toBeVisible();
        await selector.click();
        await panel.getByRole('option', { name: 'Commissariat', exact: true }).click();
        await panel.getByRole('button', { name: 'Fermer la couverture des services', exact: true }).click();
        await expect.poll(() => renderedHomeColors(page)).toEqual({ green: 0, red: 0 });
        await expect(page.locator('.collect-badge').first()).toBeVisible();

        await page.reload();
        await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
        await expect(panel).toHaveCount(0);
        if (layout === 'B') await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
        await page.locator('[data-action="stats"]').click();
        await page.getByRole('button', { name: 'Voir la couverture des services', exact: true }).click();
        await expect(selector).toHaveText('Commissariat▾');
        expect(errors).toEqual([]);
      });
    });
  }
}
