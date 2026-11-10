import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import type { Building, GameState } from '../engine/state';
import type { ClubData } from '../clubs/clubTypes';
import { liftBuilding, placeStashedBuilding, stashOf } from './stash';
import { placeStashedTiles } from './stashTiles';
import { liftBoat, placeStashedBoat } from './stashWater';

const T0 = 1_700_000_000_000;
const row = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));

function ok(outcome: { state: GameState } | { key: string }): GameState {
  if (!('state' in outcome)) throw new Error(outcome.key);
  return outcome.state;
}

describe('Clubs and Boats through a Replan', () => {
  it('brings an Arena back with its Club', () => {
    const club = { sport: 'football', squad: [1, 2, 3] } as unknown as ClubData;
    const arena = { ...createBuilding(500, 'stadium' as never, 56, 57, 0), club } as Building;
    const base = newGame({ seed: 'replan-clubs', now: T0 });
    const state = { ...base, buildings: [...base.buildings, arena] };
    const placed = ok(placeStashedBuilding(ok(liftBuilding(state, 500)), 500, 66, 56, 1));
    expect(placed.buildings.find((building) => building.id === 500)).toEqual({ ...arena, x: 66, y: 56, rotation: 1 });
  });

  it('brings a Boat back with the same id, family and Marina', () => {
    const base = newGame({ seed: 'replan-boats', now: T0 });
    const state: GameState = {
      ...base, tutorial: null, nextId: 300,
      roads: row(40, 49, 47).map((tile) => ({ ...tile, kind: 'road' as const })),
      buildings: [createBuilding(100, 'marina', 50, 48, 0)],
      waterTiles: row(50, 55, 50),
      boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 50, y: 50 }],
    };
    const lifted = ok(liftBoat(state, 200));
    expect(stashOf(lifted).boats).toEqual([{ id: 200, family: 'pleasure', marinaId: 100, x: 50, y: 50 }]);
    const placed = ok(placeStashedBoat(lifted, 200, { x: 54, y: 50 }));
    expect(placed.boats).toEqual([{ id: 200, family: 'pleasure', marinaId: 100, x: 54, y: 50 }]);
  });

  it('keeps the Marina and its Water in the Stash apart, so a lifted Marina cannot host a placed Boat', () => {
    const base = newGame({ seed: 'replan-marina', now: T0 });
    const state: GameState = {
      ...base, tutorial: null,
      buildings: [createBuilding(100, 'marina', 50, 48, 0)],
      waterTiles: row(50, 55, 50),
      boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 50, y: 50 }],
    };
    const lifted = ok(liftBuilding(ok(liftBoat(state, 200)), 100));
    expect(placeStashedBoat(lifted, 200, { x: 54, y: 50 })).toEqual({ key: 'error.unknownBuilding' });
    expect(placeStashedTiles(lifted, 'waterTiles', [{ x: 1, y: 1 }])).toEqual({ key: 'error.unknownCommand' });
  });
});
