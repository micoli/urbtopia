import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { MaximalStats } from './MaximalStats';
import { MinimalStats } from './MinimalStats';
import { CityStats } from './CityStats';

const context = vi.hoisted(() => ({ state: null as GameState | null, statsOpen: true }));
vi.mock('./hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { statsOpen: boolean; toggleStats: () => void }) => unknown) => selector({ statsOpen: context.statsOpen, toggleStats: () => {} }),
}));
vi.mock('../store/gameStore', () => ({ gameStore: { getState: () => ({ send: vi.fn() }) } }));

afterEach(() => { context.statsOpen = true; prefsStore.getState().setLanguage('en'); });

describe('city management panel', () => {
  it.each(['en', 'fr'] as const)('renders explained energy, ecology and transport in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'dashboard', now: 0 }), buildings: [createBuilding(1, 'home', 55, 57, 0)] };
    const html = renderToStaticMarkup(<MaximalStats />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(language === 'fr' ? 'Besoin non couvert' : 'Unmet demand');
    expect(html).toContain(language === 'fr' ? 'Biodiversité' : 'Biodiversity');
    expect(html).toContain(language === 'fr' ? 'Lignes de bus' : 'Bus lines');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
  it('provides accessible management buttons from both HUD entry points', () => {
    context.state = newGame({ seed: 'dashboard', now: 0 });
    for (const component of [<MinimalStats />, <CityStats />]) {
      const html = renderToStaticMarkup(component);
      expect(html).toContain('type="button"');
      expect(html).toContain('aria-label="City management"');
    }
  });
  it('does not mount the dialog when closed', () => {
    context.state = newGame({ seed: 'dashboard', now: 0 });
    context.statsOpen = false;
    expect(renderToStaticMarkup(<MaximalStats />)).toBe('');
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
