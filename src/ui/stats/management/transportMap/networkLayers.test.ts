import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../../../core';
import { layerBounds, pedestrianJunctions, pedestrianSegments, roadSegments, roadTiles, stopConnections } from './networkLayers.ts';

const base = (): GameState => ({ ...newGame({ seed: 'layers', now: 0 }), buildings: [], roads: [], roundabouts: [], pedestrianWays: [] });
const road = (x: number, y: number) => ({ x, y, kind: 'road' as const });

describe('road and pedestrian layers', () => {
  it('draws a segment between two neighbouring road tiles and none between distant ones', () => {
    const state = { ...base(), roads: [road(0, 0), road(1, 0), road(1, 1), road(5, 5)] };
    expect(roadSegments(state)).toEqual([{ x1: 0.5, y1: 0.5, x2: 1.5, y2: 0.5 }, { x1: 1.5, y1: 0.5, x2: 1.5, y2: 1.5 }]);
  });

  it('counts the tiles of a roundabout as road', () => {
    const state = { ...base(), roundabouts: [{ x: 10, y: 10 }] };
    expect(roadTiles(state).length).toBeGreaterThan(1);
    expect(roadSegments(state).length).toBeGreaterThan(1);
  });

  it('draws the Pedestrian ways on their own', () => {
    const state = { ...base(), roads: [road(0, 0)], pedestrianWays: [{ x: 3, y: 3 }, { x: 4, y: 3 }] };
    expect(pedestrianSegments(state)).toEqual([{ x1: 3.5, y1: 3.5, x2: 4.5, y2: 3.5 }]);
  });

  it('connects a bus stop to the road it faces', () => {
    const stop = createBuilding(7, 'busStop', 5, 5, 0);
    const state = { ...base(), buildings: [stop], roads: [road(5, 4), road(6, 4)] };
    expect(stopConnections(state, [stop])).toEqual([{ stop: 7, network: 'road', x: 5.5, y: 4.5 }]);
  });

  it('connects a Transit hub to the road and to the Pedestrian way it touches, from any side', () => {
    const hub = createBuilding(8, 'transitHub', 10, 10, 0);
    const state = { ...base(), buildings: [hub], roads: [road(9, 10)], pedestrianWays: [{ x: 12, y: 12 }] };
    const networks = stopConnections(state, [hub]).map(connection => connection.network).sort();
    expect(networks).toEqual(['pedestrianWay', 'road']);
  });

  it('has no connection for a stop that touches nothing', () => {
    const stop = createBuilding(7, 'busStop', 5, 5, 0);
    expect(stopConnections(base(), [stop])).toEqual([]);
  });

  it('marks the end of a Pedestrian way against a road, and only that end', () => {
    const state = { ...base(), roads: [road(0, 3), road(1, 3), road(2, 3)], pedestrianWays: [{ x: 1, y: 2 }, { x: 1, y: 1 }, { x: 1, y: 0 }] };
    expect(pedestrianJunctions(state)).toEqual([{ x: 1.5, y: 2.5 }]);
  });

  it('has bounds around the segments, or none without segment', () => {
    expect(layerBounds([{ x1: 1, y1: 2, x2: 5, y2: 2 }, { x1: 5, y1: 2, x2: 5, y2: 9 }])).toEqual({ minX: 1, minY: 2, maxX: 5, maxY: 9 });
    expect(layerBounds([])).toBeNull();
  });
});
