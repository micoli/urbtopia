import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { AchievementsSection } from './AchievementsSection';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('Achievements tab', () => {
  it.each(['en', 'fr'] as const)('lists the categories with their progress in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    context.state = { ...newGame({ seed: 'amber-fox-4821', now: 1_700_000_000_000 }), achievements: ['transport.bridge'] };
    const html = renderToStaticMarkup(<AchievementsSection />);
    expect(html).toContain(language === 'en' ? 'Transport' : 'Transports');
    expect(html).toContain(language === 'en' ? '1 of 7' : '1 sur 7');
    expect(html).toContain('data-done="true"');
  });
});
