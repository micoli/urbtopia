import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type GameState } from '../index';
import { frontAccessModes, isHubActive, perimeterTiles, placementIssue } from './placement';

const start = newGame({ seed: 'hub', now: 0 });
const empty = (): GameState => ({ ...start, ownedParcels: [{ x: 0, y: 0 }], buildings: [], roads: [], roundabouts: [], brtRoads: [], rails: [], pedestrianWays: [], urbs: 1_000_000 });
const tile = (x: number, y: number) => ({ x, y, exits: [] });

describe('Transit hub placement', () => {
  it('surrounds a 3x2 footprint with ten neighbour tiles', () => {
    expect(perimeterTiles('transitHub', 5, 5, 0)).toHaveLength(10);
  });

  it('is refused when it touches no network', () => {
    expect(placementIssue(empty(), 'transitHub', 5, 5, 0)).toBe('error.needsAccess');
  });

  it.each([
    ['a Road', (s: GameState) => ({ ...s, roads: [{ x: 4, y: 5, kind: 'road' as const }] }), 'road'],
    ['a BRT corridor', (s: GameState) => ({ ...s, brtRoads: [tile(4, 5)] }), 'brt'],
    ['a Railway', (s: GameState) => ({ ...s, rails: [tile(4, 5)] }), 'rail'],
    ['a Pedestrian way', (s: GameState) => ({ ...s, pedestrianWays: [{ x: 4, y: 5 }] }), 'pedestrianWay'],
  ])('is valid when it touches %s, from any side', (_, withNetwork, mode) => {
    const state = withNetwork(empty());
    expect(placementIssue(state, 'transitHub', 5, 5, 0)).toBeNull();
    expect(placementIssue(state, 'transitHub', 5, 5, 2)).toBeNull();
    expect(frontAccessModes(state, 'transitHub', 5, 5, 0)).toEqual([mode]);
  });

  it('is inactive while only a Pedestrian way touches it', () => {
    const hub = createBuilding(1, 'transitHub', 5, 5, 0);
    expect(isHubActive({ ...empty(), pedestrianWays: [{ x: 4, y: 5 }] }, hub)).toBe(false);
    expect(isHubActive({ ...empty(), rails: [tile(4, 5)] }, hub)).toBe(true);
  });

  it('keeps refusing to remove the last access, whichever the mode', () => {
    const hub = createBuilding(1, 'transitHub', 5, 5, 0);
    const state = { ...empty(), buildings: [hub], nextId: 10, rails: [{ x: 4, y: 5, exits: ['E' as const] }] };
    const result = dispatch(state, { type: 'DemolishTransit', mode: 'rail', from: { x: 4, y: 5 }, to: { x: 4, y: 5 } }, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.key).toBe('error.lastAccessOfBuilding');
  });
});
