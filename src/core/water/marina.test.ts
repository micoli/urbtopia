import { describe, expect, it } from 'vitest';
import { connectedWaterKeys, createBuilding, dispatch, marinaCapacity, maxTierOf, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

const row = (count: number, y = 50, fromX = 50) => Array.from({ length: count }, (_, index) => ({ x: fromX + index, y }));

function city(citizensTier = 5, urbs = 100_000): GameState {
  const base = newGame({ seed: 'marina', now: T0 });
  return {
    ...base, urbs, tutorial: null, nextId: base.nextId + 1,
    roads: [...base.roads, ...row(10, 47).map((tile) => ({ ...tile, kind: 'road' as const }))],
    buildings: [...base.buildings, { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: citizensTier }],
    waterTiles: row(3, 50),
  };
}

describe('Marina placement', () => {
  it('unlocks at 60 Citizens and costs 600 Urbs', () => {
    expect(failureKey(city(3), { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 48 })).toBe('error.itemLocked');
    const state = succeed(city(), { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 48 });
    expect(state.urbs).toBe(100_000 - 600);
  });

  it('must touch a Water tile', () => {
    expect(failureKey(city(), { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 48 })).toBeNull();
    expect(failureKey(city(), { type: 'PlaceBuilding', buildingType: 'marina', x: 56, y: 56 })).toBe('error.needsWater');
  });

  it('cannot be built on a Water tile', () => {
    expect(failureKey(city(), { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 50 })).toBe('error.tilesOccupied');
  });

  it('needs a road in front of it', () => {
    expect(failureKey({ ...city(), roads: [] }, { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 48 })).toBe('error.needsRoad');
  });
});

describe('Marina Tiers', () => {
  it('holds 3, 6 then 10 Boats', () => {
    expect(maxTierOf('marina')).toBe(3);
    expect([1, 2, 3].map((tier) => marinaCapacity({ tier }))).toEqual([3, 6, 10]);
  });

  it('upgrades with the production upgrade costs', () => {
    const placed = succeed({ ...city(), storage: { materials: {}, goods: { planks: 9, bricks: 9 } } }, { type: 'PlaceBuilding', buildingType: 'marina', x: 50, y: 48 });
    const marina = placed.buildings.find((building) => building.type === 'marina')!;
    const second = succeed(placed, { type: 'UpgradeBuilding', buildingId: marina.id });
    expect(second.urbs).toBe(placed.urbs - 300);
    expect(second.buildings.find((building) => building.id === marina.id)?.tier).toBe(2);
  });
});

describe('connectedWaterKeys', () => {
  const marina = { ...createBuilding(99, 'marina', 50, 48, 0) };

  it('reaches the Water tiles connected to the shore of the Marina', () => {
    const state = { ...city(), waterTiles: [...row(3, 50), ...row(2, 51, 52), { x: 60, y: 60 }] };
    expect([...connectedWaterKeys(state, marina)].sort()).toEqual(['50,50', '51,50', '52,50', '52,51', '53,51']);
  });

  it('does not cross land', () => {
    const state = { ...city(), waterTiles: [{ x: 50, y: 50 }, { x: 52, y: 50 }] };
    expect([...connectedWaterKeys(state, marina)]).toEqual(['50,50']);
  });

  it('is empty when the Marina touches no Water tile', () => {
    expect(connectedWaterKeys({ ...city(), waterTiles: [{ x: 60, y: 60 }] }, marina).size).toBe(0);
  });
});
