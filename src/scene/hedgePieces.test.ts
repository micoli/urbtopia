import { describe, expect, it } from 'vitest';
import { HEDGE_MODELS, hedgePiece } from './hedgePieces';

const piece = (tile: [number, number], hedges: [number, number][]) => hedgePiece({ x: tile[0], y: tile[1] }, key => hedges.some(([x, y]) => `${x},${y}` === key));

describe('hedgePiece', () => {
  it('draws a lone hedge straight', () => expect(piece([0, 0], []).model).toBe(HEDGE_MODELS.straight));
  it('draws a run straight', () => expect(piece([1, 0], [[0, 0], [2, 0]]).model).toBe(HEDGE_MODELS.straight));
  it('turns a bend into a corner', () => expect(piece([0, 0], [[1, 0], [0, 1]]).model).toBe(HEDGE_MODELS.corner));
  it('draws three neighbours as a T', () => expect(piece([0, 0], [[1, 0], [-1, 0], [0, 1]]).model).toBe(HEDGE_MODELS.t));
  it('draws four neighbours as a cross', () => expect(piece([0, 0], [[1, 0], [-1, 0], [0, 1], [0, -1]]).model).toBe(HEDGE_MODELS.cross));
});
