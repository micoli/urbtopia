import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type BuildingType, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { FrontRotation } from './FrontRotation';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { moveSelected: () => void }) => unknown) => selector({ moveSelected: () => {} }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

const render = (type: BuildingType, x: number, y: number) => {
  const building = createBuilding(900, type, x, y, 0);
  context.state = { ...newGame({ seed: 'front-rotation', now: 0 }), buildings: [building] };
  return renderToStaticMarkup(<FrontRotation building={building} />);
};

describe('FrontRotation', () => {
  it('offers both turns for an Annual event item that needs no road', () => {
    const html = render('halloweenPumpkin', 56, 59);
    expect(html).toContain(`aria-label="${t('panel.rotateLeft')}"`);
    expect(html).toContain(`aria-label="${t('panel.rotateRight')}"`);
  });

  it('offers them for a wide item too, when a turn fits', () => {
    expect(render('halloweenGraveyard', 56, 59)).toContain(`aria-label="${t('panel.rotateRight')}"`);
  });

  it('disables the turns for an ordinary building with no side that has access', () => {
    expect(render('workshop', 70, 70)).toContain(`aria-label="${t('panel.rotateRight')}" disabled=""`);
  });

  it('keeps the move button when no turn is possible', () => {
    expect(render('workshop', 70, 70)).toContain(`aria-label="${t('panel.move')}"`);
  });
});
