import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GOODS, MARKET, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ChallengesPage } from './ChallengesPage';
import { MarketRulesPage } from './MarketRulesPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('MarketRulesPage', () => {
  it.each(['en', 'fr'] as const)('explains the price rules from the game constants and lists every Good in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    context.state = newGame({ seed: 'market-page', now: 0 });
    const html = renderToStaticMarkup(<MarketRulesPage />);
    expect(html).toContain(t('codex.market.title'));
    expect(html).toContain(String(MARKET.pointsLostPerUnit));
    expect(html).toContain(String(MARKET.recoveryMs / 60_000));
    expect(html).not.toContain('{');
    expect((html.match(/<th scope="row">/g) ?? []).length).toBe(Object.keys(GOODS).length);
  });
});

describe('ChallengesPage', () => {
  it.each(['en', 'fr'] as const)('states the rules, with no placeholder left, in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<ChallengesPage />);
    expect(html).toContain(t('codex.challenges.title'));
    expect(html).toContain(t('codex.challenges.timeSkip'));
    expect(html).toContain('07');
    expect(html).not.toContain('{');
  });
});
