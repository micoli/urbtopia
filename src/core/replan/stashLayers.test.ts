import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding } from '../buildings/buildingSpecs';
import { dispatch } from '../engine/dispatch';
import { newGame } from '../engine/newGame';
import { tileKey } from '../map/geometry';
import type { Command } from '../engine/commands';
import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';
import { stashOf, type StashOutcome } from './stash';
import { liftTiles, placeStashedTiles } from './stashTiles';
import { liftNetwork, placeStashedNetwork } from './stashNetworks';
import { liftBoat, liftBridge, placeStashedBoat, placeStashedBridge } from './stashWater';

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

function ok(outcome: StashOutcome): GameState {
  if (!('state' in outcome)) throw new Error(outcome.key);
  return outcome.state;
}

const key = (outcome: StashOutcome): string | null => ('key' in outcome ? outcome.key : null);
const row = (from: number, to: number, y = 50): Coord[] => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));
const sorted = <T extends Coord>(tiles: readonly T[]): T[] => [...tiles].sort((a, b) => tileKey(a).localeCompare(tileKey(b)));

function river(): GameState {
  const base = newGame({ seed: 'replan-river', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(48, 51), ...row(55, 60)].map((tile, index) => ({ ...tile, kind: 'road' as const, ...(index === 0 ? { tier: 2 } : {}) })),
    buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }, createBuilding(100, 'marina', 50, 48, 0)],
    waterTiles: row(52, 54),
  };
}

describe('lifting and placing tiles', () => {
  it('lifts Roads off the map and places them back with their tier and kind', () => {
    const state = river();
    const lifted = ok(liftTiles(state, 'roads', state.roads));
    expect(lifted.roads).toEqual([]);
    expect(stashOf(lifted).roads).toHaveLength(state.roads.length);
    const placed = ok(placeStashedTiles(lifted, 'roads', sorted(state.roads), () => true));
    expect(sorted(placed.roads)).toEqual(sorted(state.roads));
    expect(stashOf(placed).roads).toEqual([]);
  });

  it('refuses a tile that is taken, land that is not owned and a Stash that runs out', () => {
    const lifted = ok(liftTiles(river(), 'roads', [{ x: 48, y: 50 }]));
    expect(key(placeStashedTiles(lifted, 'roads', [{ x: 53, y: 50 }]))).toBe('error.tilesOccupied');
    expect(key(placeStashedTiles(lifted, 'roads', [{ x: 1, y: 1 }]))).toBe('error.outsideOwnedParcels');
    expect(key(placeStashedTiles(lifted, 'roads', [{ x: 49, y: 52 }, { x: 50, y: 52 }]))).toBe('error.unknownCommand');
  });

  it('lifts Water tiles, Fields with their Crops and Underground walkways, and places them again', () => {
    const base = river();
    const field = { x: 58, y: 58, crop: { species: 'wheat' as const, plantedAt: T0 } };
    const state = { ...base, fields: [field], walkways: [{ x: 49, y: 53 }] };
    const lifted = ok(liftTiles(ok(liftTiles(ok(liftTiles(state, 'waterTiles', state.waterTiles ?? [])), 'fields', [field])), 'walkways', [{ x: 49, y: 53 }]));
    expect([lifted.waterTiles, lifted.fields, lifted.walkways]).toEqual([[], [], []]);
    const placed = ok(placeStashedTiles(ok(placeStashedTiles(ok(placeStashedTiles(lifted, 'waterTiles', row(52, 54))), 'fields', [{ x: 60, y: 60 }])), 'walkways', [{ x: 50, y: 60 }]));
    expect(placed.fields).toEqual([{ ...field, x: 60, y: 60 }]);
    expect(placed.walkways).toEqual([{ x: 50, y: 60 }]);
    expect(placed.waterTiles).toHaveLength(3);
  });
});

describe('lifting and placing Bridges and Boats', () => {
  it('lifts a Bridge with its deck and places it again only once its Water is back, free and with the same tier', () => {
    const bridged = succeed(river(), { type: 'PlaceBridge', x: 52, y: 50, length: 3, axis: 'x' });
    const urbs = bridged.urbs;
    const lifted = ok(liftBridge(bridged, { x: 53, y: 50 }));
    expect(lifted.bridges).toEqual([]);
    expect(stashOf(lifted).bridges).toHaveLength(1);
    const dry = ok(liftTiles(lifted, 'waterTiles', row(52, 54)));
    expect(key(placeStashedBridge(dry, 0, { x: 52, y: 50, axis: 'x' }))).toBe('error.bridgeNeedsWater');
    const wet = ok(placeStashedTiles(dry, 'waterTiles', row(52, 54)));
    const back = ok(placeStashedBridge(wet, 0, { x: 52, y: 50, axis: 'x' }));
    expect(back.bridges).toEqual(bridged.bridges);
    expect(back.urbs).toBe(urbs);
    expect(stashOf(back).bridges).toEqual([]);
  });

  it('places a Boat again only on Water that reaches its Marina', () => {
    const base = river();
    const harbour = { ...base, roads: row(40, 49, 47).map((tile) => ({ ...tile, kind: 'road' as const })), waterTiles: row(50, 55) };
    const boated = succeed(harbour, { type: 'BuyBoat', family: 'pleasure', marinaId: 100, x: 50, y: 50 });
    const boat = boated.boats?.[0];
    expect(boat).toBeDefined();
    const lifted = ok(liftBoat(boated, boat?.id ?? 0));
    expect(lifted.boats).toEqual([]);
    const dry = ok(liftTiles(lifted, 'waterTiles', harbour.waterTiles));
    expect(key(placeStashedBoat(dry, boat?.id ?? 0, { x: 53, y: 50 }))).toBe('error.notOnMarinaWater');
    const wet = ok(placeStashedTiles(dry, 'waterTiles', harbour.waterTiles));
    const back = ok(placeStashedBoat(wet, boat?.id ?? 0, { x: 53, y: 50 }));
    expect(back.boats).toEqual([{ ...boat, x: 53, y: 50 }]);
  });
});

describe('lifting and placing a transit network', () => {
  const brt = [{ x: 50, y: 60, exits: ['E' as const] }, { x: 51, y: 60, exits: ['W' as const, 'E' as const] }, { x: 52, y: 60, exits: ['W' as const] }];

  it('draws the stretch again elsewhere with its exits worked out, free, from the lifted tiles', () => {
    const state = { ...river(), brtRoads: brt };
    const lifted = ok(liftNetwork(state, 'brt'));
    expect(lifted.brtRoads).toEqual([]);
    const placed = ok(placeStashedNetwork(lifted, 'brt', { x: 50, y: 62 }, { x: 52, y: 62 }));
    expect(sorted(placed.brtRoads ?? [])).toEqual(sorted(brt.map((tile) => ({ ...tile, y: 62 }))));
    expect(stashOf(placed).brtRoads).toEqual([]);
    expect(placed.urbs).toBe(state.urbs);
  });

  it('refuses a stretch longer than what the Stash holds', () => {
    const lifted = ok(liftNetwork({ ...river(), brtRoads: brt }, 'brt'));
    expect(key(placeStashedNetwork(lifted, 'brt', { x: 50, y: 62 }, { x: 54, y: 62 }))).toBe('error.unknownCommand');
  });
});
