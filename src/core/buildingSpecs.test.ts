import { describe, expect, it } from 'vitest';
import { footprintOf, footprintTiles } from './index';

describe('building footprints', () => {
  it('keeps the catalog size at rotation 0 and 2', () => {
    expect(footprintOf('workshop', 0)).toEqual({ width: 2, depth: 2 });
    expect(footprintOf('workshop', 2)).toEqual({ width: 2, depth: 2 });
  });

  it('lists the tiles covered by a building from its anchor tile', () => {
    const tiles = footprintTiles({ type: 'factory', x: 10, y: 20, rotation: 0 });
    expect(tiles).toEqual([
      { x: 10, y: 20 },
      { x: 11, y: 20 },
      { x: 10, y: 21 },
      { x: 11, y: 21 },
    ]);
  });
});
