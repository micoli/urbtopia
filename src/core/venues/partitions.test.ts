import { describe, expect, it } from 'vitest';
import type { VenueFixture } from '../engine/state';
import { partitionPieceOf } from './partitions';

let nextId = 1;
const wall = (x: number, y: number, rotation: 0 | 1 | 2 | 3 = 0, type: VenueFixture['type'] = 'restaurantWall'): VenueFixture => ({ id: nextId++, type, x, y, rotation });
const pieceAt = (fixtures: VenueFixture[], x: number, y: number) => partitionPieceOf(fixtures.find(fixture => fixture.x === x && fixture.y === y)!, fixtures);

describe('partitionPieceOf', () => {
  it('keeps the rotation of a lone wall', () => {
    expect(pieceAt([wall(3, 3, 0)], 3, 3)).toEqual({ shape: 'straight', turns: 0 });
    expect(pieceAt([wall(3, 3, 1)], 3, 3)).toEqual({ shape: 'straight', turns: 1 });
  });

  it('lays a run along the line of its neighbours whatever the rotation', () => {
    const run = [wall(2, 3, 1), wall(3, 3, 1), wall(4, 3, 1)];
    expect(pieceAt(run, 3, 3)).toEqual({ shape: 'straight', turns: 0 });
    expect(pieceAt(run, 2, 3)).toEqual({ shape: 'straight', turns: 0 });
    const column = [wall(3, 2), wall(3, 3), wall(3, 4)];
    expect(pieceAt(column, 3, 3)).toEqual({ shape: 'straight', turns: 1 });
  });

  it('turns a corner into an elbow facing its two neighbours', () => {
    const corner = (neighbours: [number, number][]) => [wall(3, 3), ...neighbours.map(([x, y]) => wall(x, y))];
    expect(pieceAt(corner([[4, 3], [3, 4]]), 3, 3)).toEqual({ shape: 'elbow', turns: 0 });
    expect(pieceAt(corner([[4, 3], [3, 2]]), 3, 3)).toEqual({ shape: 'elbow', turns: 1 });
    expect(pieceAt(corner([[2, 3], [3, 2]]), 3, 3)).toEqual({ shape: 'elbow', turns: 2 });
    expect(pieceAt(corner([[2, 3], [3, 4]]), 3, 3)).toEqual({ shape: 'elbow', turns: 3 });
  });

  it('makes a T whose stem points at the one neighbour off the line, and a cross with four', () => {
    const around = (sides: [number, number][]) => [wall(3, 3), ...sides.map(([x, y]) => wall(x, y))];
    expect(pieceAt(around([[2, 3], [4, 3], [3, 4]]), 3, 3)).toEqual({ shape: 'tee', turns: 0 });
    expect(pieceAt(around([[3, 2], [3, 4], [4, 3]]), 3, 3)).toEqual({ shape: 'tee', turns: 1 });
    expect(pieceAt(around([[2, 3], [4, 3], [3, 2]]), 3, 3)).toEqual({ shape: 'tee', turns: 2 });
    expect(pieceAt(around([[3, 2], [3, 4], [2, 3]]), 3, 3)).toEqual({ shape: 'tee', turns: 3 });
    expect(pieceAt(around([[2, 3], [4, 3], [3, 2], [3, 4]]), 3, 3)).toEqual({ shape: 'cross', turns: 0 });
  });

  it('joins a window wall only along its own line', () => {
    const fixtures = [wall(3, 3), wall(4, 3, 0, 'restaurantWindow'), wall(3, 4, 0, 'restaurantWindow')];
    expect(pieceAt(fixtures, 3, 3)).toEqual({ shape: 'straight', turns: 0 });
  });
});
