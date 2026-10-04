import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { CasinoPanel } from './CasinoPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

const casinoCity = (tier: number, extra: Partial<GameState> = {}): { state: GameState; casino: Building } => {
  const casino = { ...createBuilding(1, 'casino', 55, 50, 0), tier };
  const state = { ...newGame({ seed: 'casino-panel', now: 0 }), buildings: [casino], urbs: 10_000, adaptationUntil: 0, tutorial: null, ...extra };
  return { state, casino };
};

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('Casino panel', () => {
  it('lists the Minigames, locks those above the Tier and offers the upgrade', () => {
    const { state, casino } = casinoCity(1, { adaptationUntil: 10 ** 12 });
    context.state = state;
    const html = renderToStaticMarkup(<CasinoPanel building={casino} />);
    expect(html).toContain(t('casino.powered'));
    expect(html).toContain(t('casino.slotMachine'));
    expect(html).toMatch(new RegExp(`disabled=""[^>]*>${t('casino.blackjack')} · ${t('home.tier')} 2`));
    expect(html).toMatch(new RegExp(`disabled=""[^>]*>${t('casino.blockmatch')} · ${t('home.tier')} 3`));
    expect(html).toContain(`${t('home.upgrade')} → 2`);
  });

  it('says the Casino is shut, and cannot be played, when it has no power', () => {
    const { state, casino } = casinoCity(1, { buildings: [{ ...createBuilding(1, 'casino', 55, 50, 0) }, { ...createBuilding(2, 'home', 46, 50, 0), tier: 8 }] });
    context.state = state;
    const html = renderToStaticMarkup(<CasinoPanel building={casino} />);
    expect(html).toContain(t('casino.shut'));
    expect(html).toMatch(new RegExp(`disabled=""[^>]*>${t('casino.slotMachine')}`));
  });

  it('is translated in French', () => {
    prefsStore.getState().setLanguage('fr');
    const { state, casino } = casinoCity(1, { adaptationUntil: 10 ** 12 });
    context.state = state;
    expect(renderToStaticMarkup(<CasinoPanel building={casino} />)).toContain('Machine à sous');
  });
});
