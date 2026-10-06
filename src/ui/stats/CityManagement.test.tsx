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
