import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILDING_SPECS, createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { BuildMenuContent } from './BuildMenuContent';
import { BUILD_SECTION_KEY, readBuildSection, writeBuildSection } from './buildMenuSections';

const context = vi.hoisted(() => ({ state: null as GameState | null, flyout: 'build' }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { flyout: string; chooseTool: () => void }) => unknown) => selector({ flyout: context.flyout, chooseTool: () => {} }),
}));

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});

afterEach(() => { prefsStore.getState().setLanguage('en'); context.flyout = 'build'; vi.unstubAllGlobals(); });

describe('build menu sections', () => {
  it.each(['en', 'fr'] as const)('groups every building once and keeps solar Homes with housing in %s', language => {
    prefsStore.getState().setLanguage(language);
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 600 }, (_, id) => ({ ...home, id })) };
    const html = renderToStaticMarkup(<BuildMenuContent />).replaceAll('&#x27;', "'");
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections).toHaveLength(12);
    expect(sections[0]).toContain(t('building.home'));
    expect(sections[0]).toContain(t('eco.solarHome'));
    expect(sections[1]).toContain(t('building.workshop'));
    expect(sections[2]).toContain(t('building.shopConstruction'));
    expect(sections[3]).toContain(t('building.storehouse'));
    expect(sections[4]).toContain(t('building.waterTower'));
    expect(sections[5]).toContain(t('building.railStation'));
    expect(sections[6]).toContain(t('building.marina'));
    expect(sections[6]).not.toContain(t('water.lay'));
    expect(sections[7]).toContain(t('build.publicFacilities'));
    expect(sections[8]).toContain(t('building.casino'));
    expect(sections[9]).toContain(t('building.stadium'));
    expect(sections[10]).toContain(t('building.nature-cliff-steps-rock'));
    expect(sections[11]).toContain(t('building.park'));
    for (const category of ['education', 'administration', 'culture', 'health', 'safety'] as const) expect(sections[7]).toContain(`<h4 class="build-category">${t(`service.${category}`)}</h4>`);
    for (const type of Object.keys(BUILDING_SPECS) as (keyof typeof BUILDING_SPECS)[]) {
      expect(html.split(`<span>${t(`building.${type}`)}</span>`)).toHaveLength(2);
      expect(html).toContain(`data-codex-id="${type}"`);
    }
    expect(html).toContain('data-codex-id="solarHome"');
  });

  it.each(['en', 'fr'] as const)('badges exactly the BRT compatible buildings in %s', language => {
    prefsStore.getState().setLanguage(language);
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 600 }, (_, id) => ({ ...home, id })) };
    const html = renderToStaticMarkup(<BuildMenuContent />);
    const compatible = (Object.keys(BUILDING_SPECS) as (keyof typeof BUILDING_SPECS)[]).filter(type => BUILDING_SPECS[type].accessModes.includes('brt'));
    expect(compatible).toEqual(expect.arrayContaining(['home', 'shop', 'casino', 'school', 'hospital', 'stadium']));
    expect(compatible).not.toContain('workshop');
    expect(html.split('class="flyout-badge"')).toHaveLength(compatible.length + 2);
    expect(html.slice(html.indexOf(t('eco.solarHome')))).toContain('class="flyout-badge"');
    expect(html).toContain(`<small class="flyout-badge">${t('build.brtCompatible')}</small>`);
  });

  it('hides locked buildings and empty sections at the start of a city', () => {
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), tutorial: 'workshop' };
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).not.toContain(t('build.greenSpaces'));
    expect(html).not.toContain(t('build.transport'));
    expect(html).not.toContain(t('building.solar'));
    expect(html).not.toContain(t('eco.solarHome'));
    expect(html).toContain('data-guided="true"');
  });

  it('unlocks Public facilities with the population, starting with the School', () => {
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: [{ ...home, tier: 1 }] };
    expect(renderToStaticMarkup(<BuildMenuContent />)).not.toContain(t('build.publicFacilities'));
    context.state = { ...context.state, buildings: [{ ...home, tier: 2 }] };
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).toContain(t('building.school'));
    expect(html).not.toContain(t('building.middleSchool'));
  });

  it('keeps road tools outside building sections', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    context.flyout = 'roads';
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).toContain(t('tool.road'));
    expect(html).not.toContain(t('build.housing'));
  });

  it('groups road tools in one section per network, each with a demolish button', () => {
    const home = createBuilding(1, 'home', 55, 57, 0);
    const big = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 700 }, (_, id) => ({ ...home, id })), waterTiles: [{ x: 50, y: 50 }], bridges: [{ x: 52, y: 50, length: 1, axis: 'x' as const }] };
    context.state = big;
    context.flyout = 'roads';
    const sections = renderToStaticMarkup(<BuildMenuContent />).match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    const demolishLabels = ['tool.demolishRoad', 'tool.demolishBrt', 'tool.demolishRail', 'water.remove', 'water.removeBridge'] as const;
    expect(sections).toHaveLength(demolishLabels.length);
    demolishLabels.forEach((key, index) => expect(sections[index]).toContain(`aria-label="${t(key)}"`));
    expect(sections[0]).toContain('▾');
    expect(sections[0]).toContain('aria-expanded="true"');
    for (const section of sections.slice(1)) {
      expect(section).toContain('aria-expanded="false"');
      expect(section).toContain('▸');
    }
  });

  it('only offers the Water and Bridge demolish buttons when there is something to remove', () => {
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 700 }, (_, id) => ({ ...home, id })) };
    context.flyout = 'roads';
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).not.toContain(t('water.remove'));
    expect(html).not.toContain(t('water.removeBridge'));
  });

  it('lays Water tiles and builds Bridges from the road tools once unlocked, not from the buildings', () => {
    const home = createBuilding(1, 'home', 55, 57, 0);
    const big = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 600 }, (_, id) => ({ ...home, id })) };
    context.state = big;
    context.flyout = 'roads';
    const roads = renderToStaticMarkup(<BuildMenuContent />);
    for (const label of [t('water.lay'), `${t('water.bridge')} · 1 ${t('water.bridgeTiles')}`, `${t('water.bridge')} · 5 ${t('water.bridgeTiles')}`]) expect(roads).toContain(label);
    context.state = { ...big, waterTiles: [{ x: 50, y: 50 }], bridges: [{ x: 52, y: 50, length: 1, axis: 'x' }] };
    const used = renderToStaticMarkup(<BuildMenuContent />);
    expect(used).toContain(t('water.remove'));
    expect(used).toContain(t('water.removeBridge'));
    context.flyout = 'build';
    const buildings = renderToStaticMarkup(<BuildMenuContent />);
    expect(buildings).toContain(t('building.marina'));
    for (const label of [t('water.lay'), t('water.remove'), t('water.removeBridge')]) expect(buildings).not.toContain(label);
  });

  it('hides the water tools from the road tools until 40 Citizens', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    context.flyout = 'roads';
    expect(renderToStaticMarkup(<BuildMenuContent />)).not.toContain(t('water.lay'));
  });

  it('opens only the first section by default', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    const html = renderToStaticMarkup(<BuildMenuContent />);
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections[0]).toContain('aria-expanded="true"');
    expect(sections[0]).toContain('aria-disabled="true"');
    expect(sections[0]).not.toContain('hidden=""');
    expect(sections[0]).toContain('▾');
    for (const section of sections.slice(1)) {
      expect(section).toContain('aria-expanded="false"');
      expect(section).toContain('hidden=""');
      expect(section).toContain('▸');
    }
  });

  it('restores the last opened section on a new render', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    writeBuildSection('build.storage');
    expect(localStorage.getItem(BUILD_SECTION_KEY)).toBe('build.storage');
    const html = renderToStaticMarkup(<BuildMenuContent />);
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections[3]).toContain('aria-expanded="true"');
    expect(sections[3]).not.toContain('hidden=""');
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
  });

  it('falls back to housing when the saved section is locked or invalid', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    for (const stored of ['build.transport', 'unknown']) {
      localStorage.setItem(BUILD_SECTION_KEY, stored);
      const html = renderToStaticMarkup(<BuildMenuContent />);
      const firstSection = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/)?.[0];
      expect(firstSection).toContain('aria-expanded="true"');
      expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    }
  });

  it('works when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Unavailable'); },
      setItem: () => { throw new Error('Unavailable'); },
    });
    expect(readBuildSection()).toBe('build.housing');
    expect(() => writeBuildSection('build.storage')).not.toThrow();
  });

  it('opens the Codex from the Water and Bridge tool names, keeping their icons', () => {
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 700 }, (_, id) => ({ ...home, id })) };
    context.flyout = 'roads';
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).toContain('data-codex-label="water"');
    expect(html).toContain('data-codex-label="bridge"');
    expect(html).toContain('assets/icons/lac.png');
    expect(html).toContain('assets/icons/bridge.png');
  });
});
