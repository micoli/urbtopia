import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding } from '../buildings/buildingSpecs';
import { dispatch } from '../engine/dispatch';
import { newGame } from '../engine/newGame';
import type { Command } from '../engine/commands';
import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';
import { stashOf } from './stash';

const T0 = 1_700_000_000_000;

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

const row = (from: number, to: number, y: number): Coord[] => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));
const zone = (x0: number, y0: number, x1: number, y1: number): Command => ({ type: 'StartReplan', area: { from: { x: x0, y: y0 }, to: { x: x1, y: y1 } } });

function city(): GameState {
  const base = newGame({ seed: 'replan-zone', now: T0 });
  return {
    ...base, urbs: 1000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(50, 59, 47), ...row(70, 75, 47)].map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [
      createBuilding(1, 'home', 50, 40, 0),
      createBuilding(2, 'home', 72, 40, 0),
      createBuilding(100, 'marina', 50, 48, 0),
      createBuilding(10, 'busStop', 52, 45, 0),
      createBuilding(11, 'busStop', 55, 45, 0),
      createBuilding(12, 'busStop', 73, 45, 0),
    ],
    waterTiles: row(50, 55, 50),
    boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 51, y: 50 }],
    busLines: [{ id: 7, stops: [10, 11, 12], loop: true }],
    transitFleet: [{ id: 9, kind: 'busBasic' as never, purchasePrice: 100, lineId: 7 }],
  };
}

describe('a Replan of a zone', () => {
  it('lifts what the rectangle touches, on every layer, and leaves the rest in place', () => {
    const replanning = succeed(city(), zone(48, 38, 62, 52));
    expect(replanning.buildings.map((building) => building.id).sort((a, b) => a - b)).toEqual([2, 12]);
    expect(stashOf(replanning).buildings.map((building) => building.id).sort((a, b) => a - b)).toEqual([1, 10, 11, 100]);
    expect(replanning.roads.map((road) => road.x).every((x) => x >= 70)).toBe(true);
    expect(stashOf(replanning).roads).toHaveLength(10);
    expect(replanning.waterTiles).toEqual([]);
    expect(stashOf(replanning).waterTiles).toHaveLength(6);
  });

  it('takes the Boats of a Marina with it, wherever they are', () => {
    const state = city();
    const farBoat = { ...state, boats: [{ id: 200, family: 'pleasure' as const, marinaId: 100, x: 80, y: 80 }] };
    const replanning = succeed(farBoat, zone(48, 46, 62, 52));
    expect(replanning.boats).toEqual([]);
    expect(stashOf(replanning).boats).toHaveLength(1);
  });

  it('keeps the lines and only takes out the stops that went into the Stash', () => {
    const state = city();
    const onlyOne = succeed(state, zone(54, 44, 56, 46));
    expect(onlyOne.busLines).toEqual([{ id: 7, stops: [10, 12] }]);
    expect(onlyOne.transitFleet?.[0]?.lineId).toBe(7);
    const mostStops = succeed(state, zone(50, 44, 56, 46));
    expect(mostStops.busLines).toEqual([]);
    expect(mostStops.transitFleet?.[0]).toEqual({ id: 9, kind: 'busBasic', purchasePrice: 100 });
  });

  it('is refused when the rectangle holds nothing, and works with the corners in either order', () => {
    expect(failureKey(city(), zone(0, 0, 5, 5))).toBe('error.replanNothingInZone');
    expect(stashOf(succeed(city(), zone(62, 52, 48, 38))).buildings).toHaveLength(4);
  });

  it('is cancelled back to the whole City as it was, lines included', () => {
    const state = city();
    expect(succeed(succeed(state, zone(48, 38, 62, 52)), { type: 'CancelReplan' })).toEqual(state);
  });
});
