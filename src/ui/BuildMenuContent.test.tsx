import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILDING_SPECS, createBuilding, newGame, type GameState } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { t } from '../i18n/t';
import { BuildMenuContent } from './BuildMenuContent';

const context = vi.hoisted(() => ({ state: null as GameState | null, flyout: 'build' }));
vi.mock('./hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { flyout: string; chooseTool: () => void }) => unknown) => selector({ flyout: context.flyout, chooseTool: () => {} }),
}));

afterEach(() => { prefsStore.getState().setLanguage('en'); context.flyout = 'build'; });

describe('build menu sections', () => {
  it.each(['en', 'fr'] as const)('groups every building once and keeps solar Homes with housing in %s', language => {
    prefsStore.getState().setLanguage(language);
    const home = createBuilding(1, 'home', 55, 57, 0);
    context.state = { ...newGame({ seed: 'build-menu', now: 0 }), buildings: Array.from({ length: 600 }, (_, id) => ({ ...home, id })) };
    const html = renderToStaticMarkup(<BuildMenuContent />).replaceAll('&#x27;', "'");
    const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections).toHaveLength(6);
    expect(sections[0]).toContain(t('building.home'));
    expect(sections[0]).toContain(t('eco.solarHome'));
    expect(sections[1]).toContain(t('building.workshop'));
    expect(sections[2]).toContain(t('building.storehouse'));
    expect(sections[3]).toContain(t('building.waterTower'));
    expect(sections[4]).toContain(t('building.park'));
    expect(sections[5]).toContain(t('building.railStation'));
    for (const type of Object.keys(BUILDING_SPECS) as (keyof typeof BUILDING_SPECS)[]) {
      expect(html.split(`<span>${t(`building.${type}`)}</span>`)).toHaveLength(2);
    }
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

  it('keeps road tools outside building sections', () => {
    context.state = newGame({ seed: 'build-menu', now: 0 });
    context.flyout = 'roads';
    const html = renderToStaticMarkup(<BuildMenuContent />);
    expect(html).toContain(t('tool.road'));
    expect(html).not.toContain('build-section');
  });
});
