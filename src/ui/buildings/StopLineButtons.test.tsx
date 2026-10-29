import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { StopLineButtons } from './StopLineButtons';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { editTransitLine: () => void }) => unknown) => selector({ editTransitLine: () => {} }),
}));

const stop = createBuilding(1, 'busStop', 10, 10, 0);
const render = (busLines: GameState['busLines']) => {
  context.state = { ...newGame({ seed: 'stop-lines', now: 0 }), buildings: [stop], busLines };
  return renderToStaticMarkup(<StopLineButtons building={stop} />);
};

describe('StopLineButtons', () => {
  it('offers one button per line serving the stop', () => {
    const html = render([{ id: 10, stops: [1, 2] }, { id: 11, stops: [3, 1] }]);
    expect(html).toContain('#10');
    expect(html).toContain('#11');
  });

  it('offers none for a stop outside any line', () => {
    expect(render([{ id: 10, stops: [2, 3] }])).toBe('');
  });
});
