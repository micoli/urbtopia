import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { BRIDGE_OPENING, closedFraction, congestionStats, createBuilding, dispatch, laneCapacity, newGame, type Boat, type Command, type GameState } from '../index';

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

const row = (from: number, to: number, y = 50) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));
const boat = (id: number, x: number, y: number): Boat => ({ id, family: 'pleasure', marinaId: 1, x, y });
const DECK = ['52,50', '53,50', '54,50'];

function crossing(boats: Boat[] = [], extraWater: { x: number; y: number }[] = []): GameState {
  const base = newGame({ seed: 'bridge-openings', now: T0 });
  const river: GameState = {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(48, 51), ...row(55, 60)].map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [
      { ...createBuilding(1, 'home', 40, 40, 0), tier: 6 },
      { ...createBuilding(2, 'waterTower', 58, 56, 0), tier: 3 },
    ],
    waterTiles: [...row(52, 54), ...row(52, 54, 51), ...row(52, 54, 52), ...extraWater],
  };
  const town = succeed(succeed(succeed(river, { type: 'PlaceBuilding', buildingType: 'home', x: 49, y: 49 }), { type: 'PlaceBuilding', buildingType: 'workshop', x: 56, y: 48 }), { type: 'PlaceBridge', x: 52, y: 50, length: 3, axis: 'x' });
  return { ...town, boats };
}

describe('closed fraction of a Bridge', () => {
  const bridge = { x: 52, y: 50, length: 3, axis: 'x' as const };
  const perBoat = (BRIDGE_OPENING.openingsPerBoatHour * BRIDGE_OPENING.minutesPerOpening) / 60;

  it('is zero without Boats', () => {
    expect(closedFraction(crossing(), bridge)).toBe(0);
  });

  it('grows with the Boats that can reach the Bridge', () => {
    expect(closedFraction(crossing([boat(10, 53, 51)]), bridge)).toBeCloseTo(perBoat);
    expect(closedFraction(crossing([boat(10, 53, 51), boat(11, 54, 52)]), bridge)).toBeCloseTo(2 * perBoat);
  });

  it('never goes above the maximum', () => {
    const fleet = Array.from({ length: 9 }, (_, index) => boat(10 + index, 52 + (index % 3), 51 + Math.floor(index / 3) % 2));
    expect(closedFraction(crossing(fleet), bridge)).toBe(BRIDGE_OPENING.maxClosed);
  });

  it('ignores Boats on another body of water', () => {
    expect(closedFraction(crossing([boat(10, 62, 62)], [{ x: 62, y: 62 }]), bridge)).toBe(0);
  });
});

describe('Bridge capacity', () => {
  it('drops by the closed fraction on every tile of the Bridge', () => {
    const open = congestionStats(crossing());
    const boated = crossing([boat(10, 53, 51), boat(11, 54, 52)]);
    const stats = congestionStats(boated);
    const cut = closedFraction(boated, { x: 52, y: 50, length: 3, axis: 'x' });
    for (const key of DECK) {
      expect(open.sections.get(key)?.capacity).toBe(laneCapacity(1));
      expect(stats.sections.get(key)!.capacity).toBeCloseTo(laneCapacity(1) * (1 - cut));
    }
  });

  it('leaves the Roads on the banks alone', () => {
    const stats = congestionStats(crossing([boat(10, 53, 51)]));
    expect(stats.sections.get('51,50')?.capacity).toBe(laneCapacity(1));
  });

  it('follows the Boats of the current state, not a stale layout', () => {
    const without = crossing();
    const withBoats = { ...without, roads: without.roads, boats: [boat(10, 53, 51), boat(11, 54, 52)] };
    expect(congestionStats(without).sections.get('53,50')!.capacity).toBe(laneCapacity(1));
    expect(congestionStats(withBoats).sections.get('53,50')!.capacity).toBeLessThan(laneCapacity(1));
  });
});

describe('Homes across the water', () => {
  it('see their Commute get more congested as Boats pile up', () => {
    const open = crossing();
    const homeId = open.buildings.find((building) => building.type === 'home' && building.id !== 1)!.id;
    const boated = crossing([boat(10, 53, 51), boat(11, 54, 52)]);
    const before = congestionStats(open).homes.get(homeId)!;
    const after = congestionStats(boated).homes.get(homeId)!;
    expect(before.disconnected).toBe(false);
    expect(after.ratio).toBeGreaterThan(before.ratio);
  });
});
