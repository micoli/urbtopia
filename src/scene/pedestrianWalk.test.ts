import { describe, expect, it } from 'vitest';
import { newGame, pedestrianGraph, type GameState } from '../core';
import { advancePedestrian, crossedTile, isOnGraph, nodePosition, pedestrianPose, startPedestrian, targetPedestrianCount } from './pedestrianWalk';

function graphOf(crossingAt: number[]) {
  const roads = Array.from({ length: 9 }, (_, x) => ({ x, y: 4, kind: crossingAt.includes(x) ? ('crossing' as const) : ('road' as const) }));
  const state: GameState = { ...newGame({ now: 0, seed: 'pedestrians' }), roads, roundabouts: [], buildings: [] };
  return pedestrianGraph(state);
}

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

describe('pedestrian walk', () => {
  it('places each sidewalk node on its side of the road tile', () => {
    expect(nodePosition('3,4:N').z).toBeLessThan(4.5);
    expect(nodePosition('3,4:S').z).toBeGreaterThan(4.5);
    expect(nodePosition('3,4:W').x).toBeLessThan(3.5);
    expect(nodePosition('3,4:E').x).toBeGreaterThan(3.5);
    expect(nodePosition('3,4:R')).toEqual({ x: 3.5, z: 4.5 });
  });

  it('moves along the edge and onto the next node', () => {
    const graph = graphOf([]);
    const walker = startPedestrian(graph, '4,4:N', 1, 1, sequence([0, 0.5]))!;
    walker.progress = 0.5;
    const before = pedestrianPose(walker);
    expect(advancePedestrian(graph, walker, 0.7, sequence([0.5]))).toBe(true);
    expect(isOnGraph(graph, walker)).toBe(true);
    expect(walker.progress).toBeCloseTo(0.2);
    expect(pedestrianPose(walker)).not.toEqual(before);
  });

  it('stays on the graph while walking for a long time', () => {
    const graph = graphOf([4]);
    const walker = startPedestrian(graph, '2,4:N', 1, 1, sequence([0.3, 0.6, 0.9]))!;
    const random = sequence([0.1, 0.7, 0.4, 0.95, 0.2]);
    for (let step = 0; step < 500; step++) {
      expect(advancePedestrian(graph, walker, 0.4, random)).toBe(true);
      expect(isOnGraph(graph, walker)).toBe(true);
    }
  });

  it('reports the tile of a Crossing only while crossing it', () => {
    const graph = graphOf([4]);
    const crossing = { id: 1, from: '4,4:N', to: '4,4:S', previous: null, progress: 0.5, speed: 1 };
    const along = { id: 2, from: '3,4:N', to: '4,4:N', previous: null, progress: 0.5, speed: 1 };
    expect(crossedTile(graph, crossing)).toBe('4,4');
    expect(crossedTile(graph, along)).toBeNull();
  });

  it('bounds the number of figures by people, sidewalk length and device', () => {
    expect(targetPedestrianCount({ people: 0, nodes: 100, touch: false })).toBe(0);
    expect(targetPedestrianCount({ people: 80, nodes: 100, touch: false })).toBe(10);
    expect(targetPedestrianCount({ people: 80, nodes: 9, touch: false })).toBe(3);
    expect(targetPedestrianCount({ people: 100000, nodes: 100000, touch: false })).toBe(100);
    expect(targetPedestrianCount({ people: 100000, nodes: 100000, touch: true })).toBe(50);
  });
});
