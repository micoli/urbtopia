import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type GameState } from '../index';

const city = (): GameState => ({ ...newGame({ seed: 'repaint-hub', now: 0 }), urbs: 100_000, buildings: [createBuilding(7, 'transitHub', 20, 20, 0)], nextId: 8 });

describe('Transit hub repaint', () => {
  it('takes one of the four colors and keeps it', () => {
    const result = dispatch(city(), { type: 'RepaintBuilding', buildingId: 7, colorVariant: 'b' }, 0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.buildings[0]!.colorVariant).toBe('b');
  });

  it('is refused for a color it does not have, and for a Bus stop', () => {
    expect(dispatch(city(), { type: 'RepaintBuilding', buildingId: 7, colorVariant: 'zzz' as never }, 0).ok).toBe(false);
    const stop = { ...city(), buildings: [createBuilding(7, 'busStop', 20, 20, 0)] };
    expect(dispatch(stop, { type: 'RepaintBuilding', buildingId: 7, colorVariant: 'a' }, 0).ok).toBe(false);
  });
});
