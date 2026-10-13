import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatch, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { SettingsContent } from './SettingsContent';

const T0 = 1_700_000_000_000;
const context = vi.hoisted(() => ({ state: null as GameState | null }));

vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { toggleSettings: () => void }) => unknown) => selector({ toggleSettings: () => {} }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: vi.fn(), newGame: vi.fn() }) } }));
vi.mock('./CloudSaveSection', () => ({ CloudSaveSection: () => null }));
vi.mock('./PreferencesContent', () => ({ PreferencesContent: () => null }));
vi.mock('./DifficultySettings', () => ({ DifficultySettings: () => null }));
vi.mock('../../pwa/useInstallPrompt', () => ({ useInstallPrompt: () => ({ canInstall: false, install: () => {} }) }));

afterEach(() => prefsStore.getState().setLanguage('en'));

function skipButton(html: string): string {
  return html.match(/<button[^>]*>\s*\+12 h\s*<\/button>/)?.[0] ?? '';
}

describe('Settings Time skip', () => {
  it('enables +12 h without a Challenge', () => {
    context.state = newGame({ seed: 'amber-fox-4821', now: T0 });
    const button = skipButton(renderToStaticMarkup(<SettingsContent />));
    expect(button).not.toBe('');
    expect(button).not.toContain('disabled');
  });

  it.each(['en', 'fr'] as const)('disables +12 h with an explanation while a Challenge is accepted, in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const started = dispatch(newGame({ seed: 'amber-fox-4821', now: T0 }), { type: 'ChallengeStart', id: 'c1', goal: [{ item: 'wood', quantity: 5 }], deadline: T0 + 1000 }, T0);
    if (!started.ok) throw new Error(started.error.key);
    context.state = started.state;
    const button = skipButton(renderToStaticMarkup(<SettingsContent />));
    expect(button).toContain('disabled');
    expect(button).toContain(language === 'fr' ? 'Un défi est en cours' : 'A Challenge is in progress');
  });
});
