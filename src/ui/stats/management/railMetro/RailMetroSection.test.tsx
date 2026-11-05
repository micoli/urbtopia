import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, transportStats } from '../../../../core';
import { prefsStore } from '../../../../i18n/prefsStore';
import { transportMapCity } from '../transportMap/transportMapFixture.ts';
import { modeUsage } from './modeUsage.ts';
import { RailMetroSection } from './RailMetroSection.tsx';

vi.mock('../../../common/hooks', () => ({
  useGame: (selector: (store: { state: object }) => unknown) => selector({ state: { buildings: [] } }),
  useUi: (selector: (store: Record<string, () => void>) => unknown) => selector({ showBuilding: () => {}, showTile: () => {} }),
}));

describe('Rail and Metro section', () => {
  it('counts the stations, the track and the line of the Railway', () => {
    const state = transportMapCity();
    const usage = modeUsage(state, transportStats(state), 'rail');
    expect(usage.stations.map(station => station.building.id).sort()).toEqual([4, 6]);
    expect(usage.stations.every(station => station.lineIds.includes(11))).toBe(true);
    expect(usage.trackTiles).toBe(17);
    expect(usage.lines.map(({ line }) => line.id)).toEqual([11]);
    expect(usage.vehicles).toBe(1);
  });

  it('keeps the Metro apart from the Railway', () => {
    const state = transportMapCity();
    const usage = modeUsage(state, transportStats(state), 'metro');
    expect(usage.stations).toEqual([]);
    expect(usage.lines).toEqual([]);
    expect(usage.advice).toEqual(['railMetro.metro.adviceNoStation']);
  });

  it('advises a line for stations that have none', () => {
    const base = transportMapCity();
    const state = { ...base, transitLines: [], transitFleet: [] };
    expect(modeUsage(state, transportStats(state), 'rail').advice).toContain('railMetro.adviceNoLine');
  });

  it.each(['en', 'fr'] as const)('renders both modes in %s', language => {
    prefsStore.getState().setLanguage(language);
    const state = transportMapCity();
    const html = renderToStaticMarkup(<RailMetroSection state={state} transport={transportStats(state)} />);
    prefsStore.getState().setLanguage('en');
    expect(html).toContain('id="eco-railMetro"');
    expect(html).toContain(language === 'fr' ? 'Trains et métro' : 'Trains and Metro');
    expect(html).toContain('data-mode="rail"');
    expect(html).toContain('data-mode="metro"');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('links the coordinates of each station to the map', () => {
    const state = transportMapCity();
    const html = renderToStaticMarkup(<RailMetroSection state={state} transport={transportStats(state)} />);
    expect(html).toContain('class="coordinates-link"');
    expect(html).toContain('(30, 1)');
  });

  it('renders on an empty city', () => {
    const state = { ...newGame({ seed: 'rail-empty', now: 0 }), buildings: [createBuilding(1, 'home', 55, 57, 0)] };
    const html = renderToStaticMarkup(<RailMetroSection state={state} transport={transportStats(state)} />);
    expect(html).toContain('No Railway station yet');
    expect(html).toContain('No Metro station yet');
  });
});
