import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { AchievementsWindow } from './AchievementsWindow';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { achievementsOpen: boolean; closeAchievements: () => void }) => unknown) => selector({ achievementsOpen: true, closeAchievements: () => {} }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('Achievements window', () => {
  it.each(['en', 'fr'] as const)('lists the categories with their progress in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'amber-fox-4821', now: 1_700_000_000_000 }), achievements: ['transport.bridge'] };
    const html = renderToStaticMarkup(<AchievementsWindow />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain(language === 'en' ? 'Transport' : 'Transports');
    expect(html).toContain(language === 'en' ? '1 of 7' : '1 sur 7');
    expect(html).toContain('data-done="true"');
  });
});
