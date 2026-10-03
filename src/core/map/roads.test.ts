import { describe, expect, it } from 'vitest';
import { roadPath, roadPiece, type Direction } from '../index';

const N: Direction = 'N';
const E: Direction = 'E';
const S: Direction = 'S';
const W: Direction = 'W';

describe('roadPiece', () => {
  it.each([
    [[], 'square', 0],
    [[E], 'end', 0],
    [[N], 'end', 1],
    [[W], 'end', 2],
    [[S], 'end', 3],
    [[E, W], 'straight', 0],
    [[N, S], 'straight', 1],
    [[W, S], 'bend', 0],
    [[S, E], 'bend', 1],
    [[E, N], 'bend', 2],
    [[N, W], 'bend', 3],
    [[E, W, S], 'intersection', 0],
    [[N, E, S], 'intersection', 1],
    [[N, E, W], 'intersection', 2],
    [[N, S, W], 'intersection', 3],
    [[N, E, S, W], 'crossroad', 0],
  ] as [Direction[], string, number][])('picks the piece for exits %j', (exits, piece, rotation) => {
    expect(roadPiece(exits)).toEqual({ piece, rotation });
  });

  it('uses the crossing piece on a straight road marked as a crossing', () => {
    expect(roadPiece([E, W], 'crossing')).toEqual({ piece: 'crossing', rotation: 0 });
    expect(roadPiece([N, S], 'crossing')).toEqual({ piece: 'crossing', rotation: 1 });
  });

  it('falls back to a plain piece when a crossing is no longer straight', () => {
    expect(roadPiece([E, W, S], 'crossing')).toEqual({ piece: 'intersection', rotation: 0 });
  });
});

describe('roadPath', () => {
  it('draws an L going horizontally first', () => {
    expect(roadPath({ x: 1, y: 1 }, { x: 3, y: 2 }, true)).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
    ]);
  });

  it('draws an L going vertically first', () => {
    expect(roadPath({ x: 1, y: 1 }, { x: 2, y: 3 }, false)).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ]);
  });

  it('draws a single tile when both ends are equal', () => {
    expect(roadPath({ x: 4, y: 4 }, { x: 4, y: 4 }, true)).toEqual([{ x: 4, y: 4 }]);
  });

  it('draws a straight line when aligned', () => {
    expect(roadPath({ x: 5, y: 2 }, { x: 2, y: 2 }, true)).toEqual([
      { x: 5, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
    ]);
  });
});
