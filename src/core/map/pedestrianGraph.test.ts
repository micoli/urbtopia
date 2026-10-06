import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../index';
import { accessNodes, crossingsOnPath, nearestTarget, pedestrianGraph, sidewalkNode, walkFrom } from './pedestrianGraph';
import { tileKey } from './geometry';

const base = newGame({ seed: 'pedestrian', now: 0 });

function withRoads(state: GameState, tiles: { x: number; y: number; kind?: 'road' | 'crossing' }[]): GameState {
  return { ...state, roads: tiles.map((tile) => ({ x: tile.x, y: tile.y, kind: tile.kind ?? 'road' })), roundabouts: [], buildings: [] };
}

function row(from: number, to: number, y: number, crossingAt: number[] = []) {
  return Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: crossingAt.includes(from + index) ? ('crossing' as const) : ('road' as const) }));
}

describe('pedestrianGraph', () => {
  it('keeps the two sides of a straight road apart', () => {
    const graph = pedestrianGraph(withRoads(base, row(0, 20, 10)));
    const reach = walkFrom(graph, [sidewalkNode({ x: 10, y: 10 }, 'N')], 8);
    expect(reach.costs.has(sidewalkNode({ x: 10, y: 10 }, 'S'))).toBe(false);
    expect(reach.costs.get(sidewalkNode({ x: 12, y: 10 }, 'N'))).toBe(2);
  });

  it('joins both sides at a Crossing', () => {
    const graph = pedestrianGraph(withRoads(base, row(0, 20, 10, [10])));
    const reach = walkFrom(graph, [sidewalkNode({ x: 10, y: 10 }, 'N')], 8);
    expect(reach.costs.get(sidewalkNode({ x: 10, y: 10 }, 'S'))).toBe(3);
    expect(crossingsOnPath(reach, sidewalkNode({ x: 10, y: 10 }, 'S'))).toEqual([tileKey({ x: 10, y: 10 })]);
  });

  it('adds the Crossing cost on every Crossing crossed', () => {
    const graph = pedestrianGraph(withRoads(base, row(0, 20, 10, [10])));
    const reach = walkFrom(graph, [sidewalkNode({ x: 8, y: 10 }, 'N')], 12);
    expect(reach.costs.get(sidewalkNode({ x: 12, y: 10 }, 'S'))).toBe(2 + 3 + 2);
  });

  it('walks around a dead end', () => {
    const graph = pedestrianGraph(withRoads(base, row(0, 4, 10)));
    const reach = walkFrom(graph, [sidewalkNode({ x: 2, y: 10 }, 'N')], 20);
    expect(reach.costs.get(sidewalkNode({ x: 2, y: 10 }, 'S'))).toBe(2 + 1 + 1 + 2);
  });

  it('ignores a Crossing that is not on a straight tile', () => {
    const roads = [...row(0, 5, 10), { x: 5, y: 11, kind: 'road' as const }, { x: 5, y: 10, kind: 'crossing' as const }];
    const graph = pedestrianGraph(withRoads(base, roads.filter((tile, index, all) => all.findIndex((other) => other.x === tile.x && other.y === tile.y && other.kind === 'crossing') === index || tile.kind === 'road')));
    const reach = walkFrom(graph, [sidewalkNode({ x: 5, y: 10 }, 'N')], 1);
    expect(reach.costs.has(sidewalkNode({ x: 5, y: 10 }, 'S'))).toBe(false);
  });

  it('connects the sidewalks of a corner on the same side', () => {
    const roads = [...row(0, 5, 10), { x: 5, y: 11, kind: 'road' as const }, { x: 5, y: 12, kind: 'road' as const }];
    const graph = pedestrianGraph(withRoads(base, roads));
    const outer = walkFrom(graph, [sidewalkNode({ x: 4, y: 10 }, 'N')], 10);
    expect(outer.costs.has(sidewalkNode({ x: 5, y: 11 }, 'E'))).toBe(true);
    const inner = walkFrom(graph, [sidewalkNode({ x: 4, y: 10 }, 'S')], 10);
    expect(inner.costs.has(sidewalkNode({ x: 5, y: 11 }, 'W'))).toBe(true);
  });

  it('does not cross a branch of an intersection without a Crossing', () => {
    const roads = [...row(0, 10, 10), ...Array.from({ length: 5 }, (_, index) => ({ x: 5, y: 11 + index, kind: 'road' as const }))];
    const graph = pedestrianGraph(withRoads(base, roads));
    const reach = walkFrom(graph, [sidewalkNode({ x: 3, y: 10 }, 'S')], 12);
    expect(reach.costs.has(sidewalkNode({ x: 7, y: 10 }, 'S'))).toBe(false);
    expect(reach.costs.has(sidewalkNode({ x: 4, y: 11 }, 'E'))).toBe(false);
    expect(reach.costs.has(sidewalkNode({ x: 5, y: 12 }, 'W'))).toBe(true);
  });

  it('walks around a roundabout without crossing it', () => {
    const roads = [...row(0, 3, 10), ...row(7, 10, 10)];
    const state = { ...withRoads(base, roads), roundabouts: [{ x: 5, y: 10 }] };
    const graph = pedestrianGraph(state);
    const reach = walkFrom(graph, [sidewalkNode({ x: 3, y: 10 }, 'N')], 14);
    expect(reach.costs.has(sidewalkNode({ x: 7, y: 10 }, 'N'))).toBe(true);
    expect(reach.costs.has(sidewalkNode({ x: 7, y: 10 }, 'S'))).toBe(true);
  });

  it('attaches a Building to the side of the road in front of it', () => {
    const state = withRoads(base, row(50, 60, 58));
    const home = { ...base.buildings[0]!, id: 99, type: 'home' as const, x: 56, y: 59, rotation: 0 as const, tier: 1 };
    const graph = pedestrianGraph(state);
    expect(accessNodes(state, graph, home)).toEqual([sidewalkNode({ x: 56, y: 58 }, 'S')]);
  });

  it('finds the nearest target with stable tie-breaks and none when out of reach', () => {
    const graph = pedestrianGraph(withRoads(base, row(0, 20, 10)));
    const reach = walkFrom(graph, [sidewalkNode({ x: 10, y: 10 }, 'N')], 4);
    const near = sidewalkNode({ x: 12, y: 10 }, 'N');
    const tie = sidewalkNode({ x: 8, y: 10 }, 'N');
    expect(nearestTarget(reach, [near, tie])).toEqual({ node: tie < near ? tie : near, cost: 2 });
    expect(nearestTarget(reach, [sidewalkNode({ x: 10, y: 10 }, 'S')])).toBeNull();
  });

  it('is deterministic', () => {
    const state = withRoads(base, row(0, 20, 10, [5]));
    expect([...pedestrianGraph({ ...state, roads: [...state.roads] })]).toEqual([...pedestrianGraph(state)]);
  });
});
