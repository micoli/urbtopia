import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding } from '../buildings/buildingSpecs';
import { dispatch } from '../engine/dispatch';
import { newGame } from '../engine/newGame';
import { tileKey } from '../map/geometry';
import type { Command } from '../engine/commands';
import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';
import { placementCost } from '../buildings/buildingSpecs';
import { WATER } from '../water/waterTiles';
import { stashOf } from './stash';
import { buildingValue } from './value';

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
const sorted = <T extends Coord>(tiles: readonly T[] = []): T[] => [...tiles].sort((a, b) => tileKey(a).localeCompare(tileKey(b)));
const lift = (action: Extract<Command, { type: 'Replan' }>['action']): Command => ({ type: 'Replan', action });

function city(): GameState {
  const base = newGame({ seed: 'replan-commands', now: T0 });
  const home = { ...createBuilding(1, 'home', 40, 40, 0), tier: 6, interior: { fixtures: [], nextFixtureId: 4, parquet: 2 } };
  const harbour: GameState = {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(40, 49, 47), ...row(48, 51, 60), ...row(55, 58, 60)].map((tile, index) => ({ ...tile, kind: 'road' as const, ...(index === 0 ? { tier: 2 } : {}) })),
    buildings: [home, createBuilding(100, 'marina', 50, 48, 0)],
    waterTiles: [...row(50, 55, 50), ...row(52, 54, 60)],
    boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 51, y: 50 }],
    busLines: [{ id: 7, stops: [1, 2] }],
    transitFleet: [{ id: 9, kind: 'busBasic' as never, purchasePrice: 100 }],
  };
  return succeed(harbour, { type: 'PlaceBridge', x: 52, y: 60, length: 3, axis: 'x' });
}

describe('starting a Replan', () => {
  it('lifts everything into the Stash, drops the lines, keeps the vehicles and costs nothing', () => {
    const state = city();
    const replanning = succeed(state, { type: 'StartReplan' });
    expect(replanning.buildings).toEqual([]);
    expect(replanning.roads).toEqual([]);
    expect(replanning.waterTiles).toEqual([]);
    expect(replanning.boats).toEqual([]);
    expect(replanning.bridges).toEqual([]);
    expect(stashOf(replanning).buildings).toHaveLength(state.buildings.length);
    expect(stashOf(replanning).bridges).toEqual(state.bridges);
    expect(sorted(stashOf(replanning).waterTiles)).toEqual(sorted(state.waterTiles));
    expect(replanning.busLines).toEqual([]);
    expect(replanning.transitFleet).toEqual(state.transitFleet);
    expect(replanning.urbs).toBe(state.urbs);
    expect(replanning.replan?.start?.buildings).toEqual(state.buildings);
  });

  it('is refused when a Replan is under way and during a Challenge', () => {
    const replanning = succeed(city(), { type: 'StartReplan' });
    expect(failureKey(replanning, { type: 'StartReplan' })).toBe('error.replanActive');
    expect(failureKey({ ...city(), challenge: { id: 'x', goal: [], deadline: T0 + 1, stock: {} } as never }, { type: 'StartReplan' })).toBe('error.replanChallenge');
  });

  it('refuses every other command while it lasts, but not the trade escrow', () => {
    const replanning = succeed(city(), { type: 'StartReplan' });
    expect(failureKey(replanning, { type: 'PlaceBuilding', buildingType: 'home', x: 60, y: 60 })).toBe('error.replanActive');
    expect(failureKey(replanning, { type: 'SkipTime', hours: 1 })).toBe('error.replanActive');
    expect(failureKey(replanning, { type: 'ConfirmDonations', ids: [] })).not.toBe('error.replanActive');
  });
});

describe('cancelling a Replan', () => {
  it('restores the layout it started from exactly, lines included, at any moment', () => {
    const state = { ...city(), busLines: [{ id: 7, stops: [1, 2] }] };
    let replanning = succeed(state, { type: 'StartReplan' });
    replanning = succeed(replanning, lift({ kind: 'placeTiles', layer: 'waterTiles', tiles: [{ x: 51, y: 55 }] }));
    const cancelled = succeed(replanning, { type: 'CancelReplan' });
    expect(cancelled).toEqual(state);
    expect(cancelled.replan).toBeUndefined();
  });
});

describe('finishing a Replan', () => {
  it('is refused while the Stash is not empty', () => {
    expect(failureKey(succeed(city(), { type: 'StartReplan' }), { type: 'FinishReplan' })).toBe('error.replanStashNotEmpty');
  });

  it('lets the player lay the City out again elsewhere, then ends with the same objects', () => {
    const state = city();
    let current = succeed(state, { type: 'StartReplan' });
    const shift = (tiles: readonly Coord[]): Coord[] => tiles.map((tile) => ({ x: tile.x + 10, y: tile.y + 12 }));
    const place = (action: Extract<Command, { type: 'Replan' }>['action']) => {
      current = succeed(current, lift(action));
    };
    place({ kind: 'placeTiles', layer: 'waterTiles', tiles: shift(state.waterTiles ?? []) });
    const tier2 = state.roads.filter((road) => road.tier === 2);
    const plain = state.roads.filter((road) => road.tier === undefined && !(state.bridges ?? []).some((bridge) => bridge.y === road.y && road.x >= bridge.x && road.x < bridge.x + bridge.length));
    place({ kind: 'placeTiles', layer: 'roads', tiles: shift(tier2), tier: 2 });
    place({ kind: 'placeTiles', layer: 'roads', tiles: shift(plain) });
    place({ kind: 'placeBridge', index: 0, x: 62, y: 72, axis: 'x' });
    for (const building of state.buildings) place({ kind: 'placeBuilding', id: building.id, x: building.x + 10, y: building.y + 12, rotation: building.rotation });
    place({ kind: 'placeBoat', id: 200, x: 61, y: 62 });
    const finished = succeed(current, { type: 'FinishReplan' });
    expect(finished.replan).toBeUndefined();
    expect(finished.buildings).toHaveLength(2);
    expect(finished.buildings.find((building) => building.id === 1)).toEqual({ ...state.buildings[0], x: 50, y: 52 });
    expect(finished.boats).toEqual([{ id: 200, family: 'pleasure', marinaId: 100, x: 61, y: 62 }]);
    expect(finished.bridges).toEqual([{ ...(state.bridges ?? [])[0], x: 62, y: 72 }]);
    expect(finished.urbs).toBe(state.urbs);
  });
});

describe('dropping items of the Stash', () => {
  it('pays back the price of a Building with its Tiers, options and Slots, and takes it out of the Stash', () => {
    const state = city();
    const replanning = succeed(state, { type: 'StartReplan' });
    const home = state.buildings.find((building) => building.id === 1)!;
    const plain = { ...home, tier: 1, solar: undefined };
    expect(buildingValue(home)).toBeGreaterThan(buildingValue(plain));
    expect(buildingValue({ ...plain, insulated: true })).toBeGreaterThan(buildingValue(plain));
    expect(buildingValue(plain)).toBe(placementCost('home'));
    const dropped = succeed(replanning, lift({ kind: 'drop', group: { kind: 'buildings', type: 'home' } }));
    expect(dropped.urbs).toBe(state.urbs + buildingValue(home));
    expect(stashOf(dropped).buildings.some((building) => building.type === 'home')).toBe(false);
  });

  it('pays back every tile of a layer at its price', () => {
    const state = city();
    const replanning = succeed(state, { type: 'StartReplan' });
    const dropped = succeed(replanning, lift({ kind: 'drop', group: { kind: 'tiles', layer: 'waterTiles' } }));
    expect(dropped.urbs).toBe(state.urbs + (state.waterTiles ?? []).length * WATER.tileCost);
    expect(stashOf(dropped).waterTiles).toEqual([]);
  });

  it('refuses a Marina while a Boat of the City still needs it', () => {
    const replanning = succeed(city(), { type: 'StartReplan' });
    expect(failureKey(replanning, lift({ kind: 'drop', group: { kind: 'buildings', type: 'marina' } }))).toBe('error.marinaInUse');
    const withoutBoats = succeed(replanning, lift({ kind: 'drop', group: { kind: 'boats', family: 'pleasure' } }));
    expect(failureKey(withoutBoats, lift({ kind: 'drop', group: { kind: 'buildings', type: 'marina' } }))).toBeNull();
  });

  it('gives the Urbs back when the Replan is cancelled, with the items', () => {
    const state = city();
    let current = succeed(state, { type: 'StartReplan' });
    current = succeed(current, lift({ kind: 'drop', group: { kind: 'buildings', type: 'home' } }));
    current = succeed(current, lift({ kind: 'drop', group: { kind: 'tiles', layer: 'waterTiles' } }));
    expect(succeed(current, { type: 'CancelReplan' })).toEqual(state);
  });

  it('puts a group off to later and brings it back', () => {
    const replanning = succeed(city(), { type: 'StartReplan' });
    const off = succeed(replanning, lift({ kind: 'setLater', id: 'building-home', later: true }));
    expect(off.replan?.later).toEqual(['building-home']);
    expect(succeed(off, lift({ kind: 'setLater', id: 'building-home', later: false })).replan?.later).toEqual([]);
  });
});
