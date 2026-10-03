import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILDING_SPECS, createBuilding, newGame, type GameState } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { t } from '../i18n/t';
import { BuildMenuContent } from './BuildMenuContent';
import { BUILD_SECTION_KEY, readBuildSection, writeBuildSection } from './buildMenuSections';

const context = vi.hoisted(() => ({ state: null as GameState | null, flyout: 'build' }));
vi.mock('./hooks', () => ({
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
    expect(sections).toHaveLength(7);
    expect(sections[0]).toContain(t('building.home'));
    expect(sections[0]).toContain(t('eco.solarHome'));
    expect(sections[1]).toContain(t('building.workshop'));
    expect(sections[2]).toContain(t('building.storehouse'));
    expect(sections[3]).toContain(t('building.waterTower'));
    expect(sections[4]).toContain(t('building.park'));
    expect(sections[5]).toContain(t('building.railStation'));
    expect(sections[6]).toContain(t('build.publicFacilities'));
    for (const category of ['education', 'administration', 'culture', 'health', 'safety'] as const) expect(sections[6]).toContain(`<h4 class="build-category">${t(`service.${category}`)}</h4>`);
    for (const type of Object.keys(BUILDING_SPECS) as (keyof typeof BUILDING_SPECS)[]) {
      expect(html.split(`<span>${t(`building.${type}`)}</span>`)).toHaveLength(2);
      expect(html).toContain(`data-codex-id="${type}"`);
    }
    expect(html).toContain('data-codex-id="solarHome"');
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
    expect(html).not.toContain('build-section');
  });

  it('opens only the first section by default', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    const html = renderToStaticMarkup(<BuildMenuContent />);
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections[0]).toContain('aria-expanded="true"');
    expect(sections[0]).toContain('aria-disabled="true"');
    expect(sections[0]).not.toContain('hidden=""');
    expect(html).not.toContain('▾');
    expect(html).not.toContain('▸');
    for (const section of sections.slice(1)) {
      expect(section).toContain('aria-expanded="false"');
      expect(section).toContain('hidden=""');
    }
  });

  it('restores the last opened section on a new render', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    writeBuildSection('build.storage');
    expect(localStorage.getItem(BUILD_SECTION_KEY)).toBe('build.storage');
    const html = renderToStaticMarkup(<BuildMenuContent />);
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections[2]).toContain('aria-expanded="true"');
    expect(sections[2]).not.toContain('hidden=""');
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
});
