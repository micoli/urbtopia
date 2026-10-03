import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { chooseNextTile } from './roadWalk';

function graphOf(roads: [number, number][]) {
  const state: GameState = { ...newGame({ now: 0, seed: 'test' }), roads: roads.map(([x, y]) => ({ x, y, kind: 'road' as const })), roundabouts: [] };
  return buildRoadGraph(state);
}

describe('chooseNextTile', () => {
  const row = graphOf([[1, 5], [2, 5], [3, 5]]);

  it('keeps going straight along a road', () => {
    expect(chooseNextTile(row, { x: 2, y: 5 }, { x: 1, y: 5 }, 0.9)).toEqual({ x: 3, y: 5 });
  });

  it('turns around at a dead end', () => {
    expect(chooseNextTile(row, { x: 3, y: 5 }, { x: 2, y: 5 }, 0.5)).toEqual({ x: 2, y: 5 });
  });

  it('picks a random exit, never the way it came from, when it cannot go straight', () => {
    const tJunction = graphOf([[4, 5], [5, 5], [5, 4], [5, 6]]);
    expect(chooseNextTile(tJunction, { x: 5, y: 5 }, { x: 4, y: 5 }, 0.1)).toEqual({ x: 5, y: 4 });
    expect(chooseNextTile(tJunction, { x: 5, y: 5 }, { x: 4, y: 5 }, 0.9)).toEqual({ x: 5, y: 6 });
  });

  it('goes straight through a crossroad whatever the random value', () => {
    const crossroad = graphOf([[4, 5], [5, 5], [6, 5], [5, 4], [5, 6]]);
    expect(chooseNextTile(crossroad, { x: 5, y: 5 }, { x: 5, y: 4 }, 0.1)).toEqual({ x: 5, y: 6 });
  });

  it('starts along any exit when it has no previous tile', () => {
    expect(chooseNextTile(row, { x: 1, y: 5 }, null, 0.5)).toEqual({ x: 2, y: 5 });
  });

  it('stays put on a tile that leads nowhere', () => {
    const alone = graphOf([[8, 8]]);
    expect(chooseNextTile(alone, { x: 8, y: 8 }, null, 0.5)).toEqual({ x: 8, y: 8 });
  });
});

describe('chooseNextTile on a roundabout', () => {
  const state: GameState = { ...newGame({ now: 0, seed: 'test' }), roads: [{ x: 8, y: 10, kind: 'road' }], roundabouts: [{ x: 10, y: 10 }] };
  const graph = buildRoadGraph(state);
  const arrivingFromAbove = { x: 9, y: 9 };
  const sideMiddle = { x: 9, y: 10 };

  it('leaves by the side road or keeps circling depending on the random value', () => {
    expect(chooseNextTile(graph, sideMiddle, arrivingFromAbove, 0.1)).toEqual({ x: 9, y: 11 });
    expect(chooseNextTile(graph, sideMiddle, arrivingFromAbove, 0.9)).toEqual({ x: 8, y: 10 });
  });
});
