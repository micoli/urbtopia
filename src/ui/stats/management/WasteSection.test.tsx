import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../../core';
import { prefsStore } from '../../../i18n/prefsStore';
import { WasteSection } from './WasteSection';

vi.mock('../../common/hooks', () => ({
  useUi: (selector: (store: { showTile: () => void; openCodex: () => void }) => unknown) => selector({ showTile: () => {}, openCodex: () => {} }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const home = (id: number, x: number, y: number, tier: number): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste-section', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});
const render = (state: GameState) => renderToStaticMarkup(<WasteSection state={state} onShowEmissions={() => {}} />);

describe('Waste section', () => {
  it.each(['en', 'fr'] as const)('details the balance, facilities, coverage, impacts and pedestrian districts in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(city([{ ...createBuilding(1, 'mound', 60, 50, 0), tier: 1 }, home(10, 62, 50, 3), ...Array.from({ length: 20 }, (_, index) => home(20 + index, 20, 20 + index, 8))]));
    expect(html).toContain('id="eco-waste"');
    expect(html).toContain(language === 'fr' ? 'Bilan du jour' : 'Balance of the day');
    expect(html).toContain(language === 'fr' ? 'Usine de recyclage' : 'Recycling plant');
    expect(html).toContain(language === 'fr' ? 'Hors de portée' : 'Out of reach');
    expect(html).toContain(language === 'fr' ? 'Homes sous une zone d’odeur' : 'Homes under an Odor radius');
    expect(html).toContain(language === 'fr' ? 'Quartiers piétons' : 'Pedestrian districts');
    expect(html).toContain(language === 'fr' ? 'Voir le pire goulot' : 'Show the worst bottleneck');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('{');
  });

  it('says when facilities are stopped for lack of Urbs', () => {
    const html = render(city([{ ...createBuilding(1, 'mound', 60, 50, 0), tier: 1 }, home(10, 62, 50, 3)], { urbs: 0 }));
    expect(html).toContain('stopped, no Urbs: 1');
    expect(html).toContain('Facility stopped, no Urbs');
  });

  it('stays calm in an empty city', () => {
    const html = render(city([]));
    expect(html).toContain('No Home produces Waste yet.');
    expect(html).toContain('Every Home is covered.');
    expect(html).not.toContain('Show the worst bottleneck');
    expect(html).not.toContain('NaN');
  });
});
