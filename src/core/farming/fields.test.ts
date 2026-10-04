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

function cityWithFarm(farmTier = 1, urbs = 10_000): GameState {
  const base = newGame({ seed: 'fields', now: T0 });
  return { ...base, urbs, nextId: base.nextId + 1, buildings: [...base.buildings, { ...createBuilding(base.nextId, 'farm', 56, 59, 0), tier: farmTier }] };
}

describe('Laying Field tiles', () => {
  it('costs 5 Urbs per tile', () => {
    const state = succeed(cityWithFarm(), { type: 'LayFields', tiles: row(3) });
    expect(state.fields).toEqual(row(3));
    expect(state.urbs).toBe(10_000 - 15);
  });

  it('needs a Farm', () => {
    expect(failureKey({ ...cityWithFarm(), buildings: newGame({ seed: 'fields', now: T0 }).buildings }, { type: 'LayFields', tiles: row(1) })).toBe('error.noFarm');
  });

  it('skips tiles that are outside owned Parcels, built on, roads or already Fields', () => {
    const state = succeed(cityWithFarm(), { type: 'LayFields', tiles: [{ x: 5, y: 5 }, { x: 54, y: 56 }, { x: 55, y: 58 }, ...row(1)] });
    expect(state.fields).toEqual(row(1));
    expect(state.urbs).toBe(10_000 - 5);
    expect(failureKey(state, { type: 'LayFields', tiles: row(1) })).toBe('error.tilesOccupied');
    expect(failureKey(cityWithFarm(), { type: 'LayFields', tiles: [{ x: 5, y: 5 }] })).toBe('error.outsideOwnedParcels');
  });

  it('stops at the Field cap of the Farm Tier', () => {
    const state = succeed(cityWithFarm(), { type: 'LayFields', tiles: row(14) });
    expect(state.fields).toHaveLength(12);
    expect(failureKey(state, { type: 'LayFields', tiles: row(1, 51) })).toBe('error.fieldCapReached');
    expect(succeed({ ...state, buildings: state.buildings.map(b => b.type === 'farm' ? { ...b, tier: 2 } : b) }, { type: 'LayFields', tiles: row(14, 51) }).fields).toHaveLength(24);
  });

  it('stops when Urbs run out', () => {
    const state = succeed(cityWithFarm(1, 12), { type: 'LayFields', tiles: row(5) });
    expect(state.fields).toHaveLength(2);
    expect(state.urbs).toBe(2);
    expect(failureKey(state, { type: 'LayFields', tiles: row(1, 51) })).toBe('error.notEnoughUrbs');
  });

  it('blocks buildings and roads on Field tiles', () => {
    const state = succeed(cityWithFarm(), { type: 'LayFields', tiles: [{ x: 50, y: 50 }, { x: 51, y: 50 }, { x: 50, y: 51 }, { x: 51, y: 51 }] });
    expect(failureKey(state, { type: 'PlaceBuilding', buildingType: 'workshop', x: 50, y: 50 })).toBe('error.tilesOccupied');
  });
});

describe('Removing Field tiles', () => {
  const laid = succeed(cityWithFarm(), { type: 'LayFields', tiles: row(3) });

  it('is free', () => {
    const state = succeed(laid, { type: 'RemoveFields', tiles: [{ x: 51, y: 50 }, { x: 70, y: 70 }] });
    expect(state.fields).toEqual([{ x: 50, y: 50 }, { x: 52, y: 50 }]);
    expect(state.urbs).toBe(laid.urbs);
  });

  it('loses a planted Crop with no refund', () => {
    const planted: GameState = { ...laid, fields: laid.fields.map(f => f.x === 51 ? { ...f, crop: { species: 'wheat', plantedAt: T0 } } : f) };
    const state = succeed(planted, { type: 'RemoveFields', tiles: [{ x: 51, y: 50 }] });
    expect(state.seedStock).toEqual(planted.seedStock);
    expect(state.urbs).toBe(planted.urbs);
    expect(state.fields.some(f => f.crop)).toBe(false);
  });

  it('refuses when there is no Field under the tiles', () => {
    expect(failureKey(laid, { type: 'RemoveFields', tiles: [{ x: 60, y: 60 }] })).toBe('error.noFieldHere');
  });
});
