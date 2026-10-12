import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { HomePanel } from './HomePanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
    Upgrade: () => <p>upgrade</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (difficulty: Difficulty) => {
  const building = createBuilding(900, 'home', 56, 59, 0);
  context.state = { ...newGame({ seed: 'home-panel', now: 0 }), difficulty, adaptationUntil: 0, buildings: [building] };
  return renderToStaticMarkup(<HomePanel building={building} />);
};

describe('HomePanel Sanction', () => {
  it.each(['en', 'fr'] as const)('names the cause and the Tax lost of a sanctioned Home in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('easy');
    expect(html).toContain(t('home.sanction'));
    expect(html).toContain(t('needs.factor.electricity'));
    expect(html).toContain('−50%');
    expect(html).not.toContain('NaN');
  });

  it('shows nothing about a Sanction under Cozy', () => {
    expect(render('cozy')).not.toContain(t('home.sanction'));
  });
});
