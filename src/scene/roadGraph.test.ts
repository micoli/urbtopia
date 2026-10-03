import { describe, expect, it } from 'vitest';
import { newGame, tileKey, type Coord, type GameState } from '../core';
import { buildRoadGraph, neighboursOf } from './roadGraph';

function cityWith(roads: [number, number][], roundabouts: [number, number][] = []): GameState {
  return {
    ...newGame({ now: 0, seed: 'test' }),
    roads: roads.map(([x, y]) => ({ x, y, kind: 'road' as const })),
    roundabouts: roundabouts.map(([x, y]) => ({ x, y })),
  };
}

const keys = (tiles: readonly Coord[]) => tiles.map(tileKey).sort();

describe('buildRoadGraph', () => {
  const row = buildRoadGraph(cityWith([[1, 5], [2, 5], [3, 5]]));

  it('links a road tile to the road tiles next to it', () => {
    expect(keys(neighboursOf(row, { x: 2, y: 5 }))).toEqual(['1,5', '3,5']);
  });

  it('gives a dead end a single neighbour', () => {
    expect(keys(neighboursOf(row, { x: 1, y: 5 }))).toEqual(['2,5']);
  });

  it('knows nothing about tiles without a road', () => {
    expect(neighboursOf(row, { x: 9, y: 9 })).toEqual([]);
  });
});

describe('buildRoadGraph around a roundabout', () => {
  const graph = buildRoadGraph(cityWith([[7, 10], [8, 10]], [[10, 10]]));

  it('lets a road enter the middle of the ring side it touches', () => {
    expect(keys(neighboursOf(graph, { x: 8, y: 10 }))).toEqual(['7,10', '9,10']);
    expect(keys(neighboursOf(graph, { x: 9, y: 10 }))).toEqual(['8,10', '9,11', '9,9']);
  });

  it('runs the ring around the centre, corners included', () => {
    expect(keys(neighboursOf(graph, { x: 9, y: 9 }))).toEqual(['10,9', '9,10']);
  });

  it('does not let a road enter through a corner of the ring', () => {
    const withCornerRoad = buildRoadGraph(cityWith([[8, 9]], [[10, 10]]));
    expect(keys(neighboursOf(withCornerRoad, { x: 9, y: 9 }))).toEqual(['10,9', '9,10']);
  });

  it('keeps the centre island out of the graph', () => {
    expect(neighboursOf(graph, { x: 10, y: 10 })).toEqual([]);
    expect(keys(neighboursOf(graph, { x: 10, y: 9 }))).toEqual(['11,9', '9,9']);
  });
});
