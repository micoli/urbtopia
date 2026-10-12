import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES, SANCTIONS, newGame, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { DifficultySettings } from './DifficultySettings';
import { difficultyDescription } from './difficultyDescription';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: vi.fn() }) } }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (difficulty?: Difficulty) => {
  context.state = { ...newGame({ seed: 'difficulty-settings', now: 0 }), ...(difficulty ? { difficulty } : {}) };
  return renderToStaticMarkup(<DifficultySettings />).replaceAll('&#x27;', "'");
};

describe('Difficulty settings', () => {
  it.each(['en', 'fr'] as const)('offers the four Difficulties in %s, Cozy checked for a city without one', language => {
    prefsStore.getState().setLanguage(language);
    const html = render();
    for (const id of DIFFICULTIES) expect(html).toContain(t(`difficulty.${id}`));
    expect(html).toMatch(/aria-checked="true"[^>]*>Cozy</);
  });

  it('checks the Difficulty of the city', () => {
    expect(render('hard')).toMatch(/aria-checked="true"[^>]*>Hard</);
  });

  it.each(DIFFICULTIES)('describes %s from the Sanctions balance, in both languages', difficulty => {
    for (const language of ['en', 'fr'] as const) {
      prefsStore.getState().setLanguage(language);
      const text = difficultyDescription(difficulty);
      expect(text).not.toContain('{');
      if (SANCTIONS[difficulty].factors.length === 0) continue;
      expect(text).toContain(String(Math.round(100 * (1 - SANCTIONS[difficulty].taxFloor))));
      for (const factor of SANCTIONS[difficulty].factors) expect(text).toContain(t(`needs.factor.${factor}`));
    }
  });
});
