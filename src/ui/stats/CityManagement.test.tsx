import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { WALKING } from '../../core/traffic/walking';
import { climateStats, createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { CityManagement } from './CityManagement.tsx';
import { MinimalStats } from './MinimalStats';
import { CityStats } from './CityStats';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const context = vi.hoisted(() => ({ state: null as GameState | null, statsOpen: true }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { statsOpen: boolean; toggleStats: () => void }) => unknown) => selector({ statsOpen: context.statsOpen, toggleStats: () => {} }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: vi.fn() }) } }));

afterEach(() => { context.statsOpen = true; prefsStore.getState().setLanguage('en'); });

describe('city management panel', () => {
  it.each(['en', 'fr'] as const)('renders explained energy, ecology and transport in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'dashboard', now: 0 }), buildings: [createBuilding(1, 'home', 55, 57, 0)] };
    const html = renderToStaticMarkup(<CityManagement />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(language === 'fr' ? 'Besoin non couvert' : 'Unmet demand');
    expect(html).toContain(language === 'fr' ? 'Biodiversité' : 'Biodiversity');
    expect(html).toContain(language === 'fr' ? 'Lignes de transport' : 'Transit lines');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
  it.each(['en', 'fr'] as const)('explains road traffic, the car and public transport mix and the congestion penalty in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'traffic-panel', now: 0 }), buildings: [...newGame({ seed: 'traffic-panel', now: 0 }).buildings, { ...createBuilding(40, 'home', 56, 59, 0), tier: 6 }] };
    const html = renderToStaticMarkup(<CityManagement />);
    expect(html).toContain('id="eco-traffic"');
    expect(html).toContain(language === 'fr' ? 'Trafic routier' : 'Road traffic');
    expect(html).toContain(language === 'fr' ? 'En voiture' : 'By car');
    expect(html).toContain(language === 'fr' ? 'Emplois disponibles' : 'Jobs available');
    expect(html).toContain(language === 'fr' ? 'Malus de bien-être des bouchons' : 'Congestion Well-being penalty');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
  it.each(['en', 'fr'] as const)('shows the car, public transport and walking mix with the walking details in %s', language => {
    prefsStore.getState().setLanguage(language);
    WALKING.enabled = true;
    const start = newGame({ seed: 'walking-panel', now: 0 });
    context.state = { ...start, roads: [...start.roads], buildings: [...start.buildings, { ...createBuilding(40, 'home', 56, 59, 0), tier: 1 }, createBuilding(41, 'shop', 57, 57, 0)] };
    const html = renderToStaticMarkup(<CityManagement />);
    WALKING.enabled = false;
    expect(html).toContain(language === 'fr' ? 'À pied' : 'On foot');
    expect(html).toContain(language === 'fr' ? 'Sorties à pied vers les services' : 'Walks to services');
    expect(html).toContain(language === 'fr' ? 'Passages piétons saturés' : 'Saturated crossings');
    expect(html).toContain(language === 'fr' ? 'Commerces' : 'Shops');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
  it.each(['en', 'fr'] as const)('shows how traffic slows the bus lines in %s', language => {
    prefsStore.getState().setLanguage(language);
    const start = newGame({ seed: 'bus-panel', now: 0 });
    const homes = [0, 1, 2].map(index => ({ ...createBuilding(40 + index, 'home', 53 + 2 * index, 59, 0), tier: 7 }));
    const stops = [createBuilding(60, 'busStop', 59, 59, 0), createBuilding(61, 'busStop', 61, 59, 0)];
    const city = (lines: number): GameState => ({ ...start, adaptationUntil: 0, roads: [...start.roads], nextId: 100, buildings: [...start.buildings.map(building => ({ ...building, tier: 8 })), ...homes, ...stops], busLines: Array.from({ length: lines }, (_, index) => ({ id: 20 + index, stops: [60, 61] })) });
    context.state = city(1);
    const slowed = renderToStaticMarkup(<CityManagement />);
    expect(slowed).toContain(language === 'fr' ? 'Lignes de bus ralenties par les bouchons: 1' : 'Bus lines slowed by traffic: 1');
    expect(slowed).toContain(language === 'fr' ? 'ralentie par les bouchons' : 'slowed by traffic');
    expect(slowed).not.toContain('NaN');
    expect(slowed).not.toContain('undefined');
    context.state = { ...city(1), buildings: city(1).buildings.slice(0, -2).filter(building => building.id < 41), busLines: [] };
    const calm = renderToStaticMarkup(<CityManagement />);
    expect(calm).toContain(language === 'fr' ? 'Lignes de bus ralenties par les bouchons: 0' : 'Bus lines slowed by traffic: 0');
    expect(calm).not.toContain('🐌');
  });
  it.each(['en', 'fr'] as const)('offers the worst bottleneck only when a road is saturated in %s', language => {
    prefsStore.getState().setLanguage(language);
    const label = language === 'fr' ? 'Voir le pire goulot' : 'Show the worst bottleneck';
    const start = newGame({ seed: 'bottleneck', now: 0 });
    const home = (tier: number) => ({ ...createBuilding(40, 'home', 56, 59, 0), tier });
    context.state = { ...start, adaptationUntil: 0, buildings: [...start.buildings.map(building => ({ ...building, tier: 8 })), home(7)] };
    expect(renderToStaticMarkup(<CityManagement />)).toContain(label);
    context.state = { ...start, adaptationUntil: 0, buildings: [...start.buildings, home(1)] };
    const calm = renderToStaticMarkup(<CityManagement />);
    expect(calm).not.toContain(label);
    expect(calm).not.toContain('NaN');
  });
  it('provides accessible management buttons from both HUD entry points', () => {
    context.state = newGame({ seed: 'dashboard', now: 0 });
    for (const component of [<MinimalStats />, <CityStats />]) {
      const html = renderToStaticMarkup(component);
      expect(html).toContain('aria-label="City management"');
    }
  });
  it.each(['en', 'fr'] as const)('shows the same city temperature in the minimal HUD and management panel in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'temperature', now: 0 }), buildings: [createBuilding(1, 'factory', 0, 0, 0)] };
    const temperature = climateStats(context.state).temperature.toFixed(1);
    const label = language === 'fr' ? 'Température de la ville' : 'City temperature';
    const minimal = renderToStaticMarkup(<MinimalStats />);
    const maximal = renderToStaticMarkup(<CityManagement />);
    expect(minimal).toContain(`aria-label="${label}: ${temperature} °C"`);
    expect(minimal).toContain('🌡️');
    expect(maximal).toContain(`<strong>${temperature} <small>°C</small></strong>`);
    expect(maximal).toContain(label);
    expect(maximal).toContain(language === 'fr' ? 'Optimum : 26 °C' : 'Optimum: 26 °C');
  });
  it('does not mount the dialog when closed', () => {
    context.state = newGame({ seed: 'dashboard', now: 0 });
    context.statsOpen = false;
    expect(renderToStaticMarkup(<CityManagement />)).toBe('');
  });

  it('shows the simulation clock in both HUD entry points, including skipped time', () => {
    context.state = { ...newGame({ seed: 'dashboard', now: 23 * 3_600_000 + 30 * 60_000 }), timeOffset: 2 * 3_600_000 };
    for (const component of [<MinimalStats />, <CityStats />]) {
      const html = renderToStaticMarkup(component);
      expect(html).toContain('class="game-clock"');
      expect(html).toContain('dateTime="01:30"');
      expect(html).toContain('01:30');
    }
  });
});
