import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Command, type GameState } from '../index';

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

function city(citizensTier = 4, urbs = 10_000): GameState {
  const base = newGame({ seed: 'water', now: T0 });
  return { ...base, urbs, tutorial: null, nextId: base.nextId + 1, buildings: [...base.buildings, { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: citizensTier }] };
}

describe('Laying Water tiles', () => {
  it('costs 30 Urbs per tile', () => {
    const state = succeed(city(), { type: 'LayWater', tiles: row(3) });
    expect(state.waterTiles).toEqual(row(3));
    expect(state.urbs).toBe(10_000 - 90);
  });

  it('is locked below 40 Citizens', () => {
    expect(failureKey(city(3), { type: 'LayWater', tiles: row(1) })).toBe('error.itemLocked');
    expect(failureKey(city(4), { type: 'LayWater', tiles: row(1) })).toBeNull();
  });

  it('skips tiles outside owned Parcels, built on or already Water', () => {
    const base = city();
    const state = succeed(base, { type: 'LayWater', tiles: [{ x: 5, y: 5 }, { x: 40, y: 40 }, ...row(1)] });
    expect(state.waterTiles).toEqual(row(1));
    expect(state.urbs).toBe(base.urbs - 30);
    expect(failureKey(state, { type: 'LayWater', tiles: row(1) })).toBe('error.tilesOccupied');
    expect(failureKey(base, { type: 'LayWater', tiles: [{ x: 5, y: 5 }] })).toBe('error.outsideOwnedParcels');
  });

  it('stops when Urbs run out', () => {
    const state = succeed(city(4, 70), { type: 'LayWater', tiles: row(5) });
    expect(state.waterTiles).toHaveLength(2);
    expect(state.urbs).toBe(10);
    expect(failureKey(city(4, 10), { type: 'LayWater', tiles: row(1) })).toBe('error.notEnoughUrbs');
  });

  it('refuses roads, Fields and buildings on a Water tile', () => {
    const state = succeed(city(), { type: 'LayWater', tiles: row(1) });
    expect(failureKey(state, { type: 'BuildRoad', from: { x: 50, y: 50 }, to: { x: 52, y: 50 } })).toBe('error.tilesOccupied');
    expect(failureKey(state, { type: 'PlaceBuilding', buildingType: 'workshop', x: 50, y: 50, rotation: 0 })).toBe('error.tilesOccupied');
  });
});

describe('Removing Water tiles', () => {
  it('is free', () => {
    const laid = succeed(city(), { type: 'LayWater', tiles: row(3) });
    const state = succeed(laid, { type: 'RemoveWater', tiles: row(2) });
    expect(state.waterTiles).toEqual([{ x: 52, y: 50 }]);
    expect(state.urbs).toBe(laid.urbs);
  });

  it('fails when no Water tile is targeted', () => {
    expect(failureKey(city(), { type: 'RemoveWater', tiles: row(1) })).toBe('error.noWaterHere');
  });
});
