import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ECOLOGY, createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { RepaintRow } from './RepaintRow';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (urbs: number) => {
  const building = createBuilding(900, 'home', 56, 59, 0);
  context.state = { ...newGame({ seed: 'repaint-row', now: 0 }), urbs, buildings: [building] };
  return renderToStaticMarkup(<RepaintRow building={building} />);
};

describe('RepaintRow', () => {
  it('explains why the colors are disabled when the Urbs are short', () => {
    const html = render(ECOLOGY.repaintCost - 1);
    expect(html).toContain(t('blocked.urbs').replace('{cost}', String(ECOLOGY.repaintCost)));
    expect(html).toContain('disabled=""');
  });

  it('says nothing when the Repaint is affordable', () => {
    const html = render(ECOLOGY.repaintCost);
    expect(html).not.toContain(t('blocked.urbs').replace('{cost}', String(ECOLOGY.repaintCost)));
    expect(html).not.toContain('disabled=""');
  });

  it('explains the Repaint the first time in French too', () => {
    prefsStore.getState().setLanguage('fr');
    expect(render(ECOLOGY.repaintCost)).toContain(t('hint.repaint'));
  });
});
