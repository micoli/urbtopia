import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { advance, createBuilding, dispatch, homeBenefits, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

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
const buy = (x: number, y = 50, marinaId = 100): Command => ({ type: 'BuyBoat', family: 'pleasure', marinaId, x, y });

function harbour(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'boats', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 200,
    roads: row(10, 47).map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [
      { ...createBuilding(1, 'home', 40, 40, 0), tier: 6 },
      { ...createBuilding(100, 'marina', 50, 48, 0) },
    ],
    waterTiles: row(6, 50),
    ...overrides,
  };
}

describe('Buying a Pleasure boat', () => {
  it('costs 400 Urbs and places the Boat on a Water tile connected to the Marina', () => {
    const state = succeed(harbour(), buy(52));
    expect(state.urbs).toBe(100_000 - 400);
    expect(state.boats).toEqual([{ id: 200, family: 'pleasure', marinaId: 100, x: 52, y: 50 }]);
  });

  it('unlocks at 80 Citizens', () => {
    const small = harbour({ buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 4 }, createBuilding(100, 'marina', 50, 48, 0)] });
    expect(failureKey(small, buy(52))).toBe('error.itemLocked');
  });

  it('refuses land, disconnected water and occupied tiles', () => {
    const state = harbour({ waterTiles: [...row(3, 50), { x: 58, y: 50 }] });
    expect(failureKey(state, buy(55))).toBe('error.notOnMarinaWater');
    expect(failureKey(state, buy(58))).toBe('error.notOnMarinaWater');
    expect(failureKey(succeed(state, buy(51)), buy(51))).toBe('error.tilesOccupied');
  });

  it('is limited by the capacity of the Marina Tier', () => {
    let state = harbour();
    for (const x of [50, 51, 52]) state = succeed(state, buy(x));
    expect(failureKey(state, buy(53))).toBe('error.marinaFull');
    const upgraded = { ...state, buildings: state.buildings.map((b) => (b.type === 'marina' ? { ...b, tier: 2 } : b)) };
    expect(failureKey(upgraded, buy(53))).toBeNull();
  });

  it('needs enough Urbs and an existing Marina', () => {
    expect(failureKey(harbour({ urbs: 399 }), buy(52))).toBe('error.notEnoughUrbs');
    expect(failureKey(harbour(), buy(52, 50, 1))).toBe('error.unknownBuilding');
  });

  it('refunds part of the price when sold', () => {
    const bought = succeed(harbour(), buy(52));
    const sold = succeed(bought, { type: 'SellBoat', id: 200 });
    expect(sold.boats).toEqual([]);
    expect(sold.urbs).toBe(bought.urbs + 300);
    expect(failureKey(sold, { type: 'SellBoat', id: 200 })).toBe('error.unknownBoat');
  });
});

describe('Pleasure boat Well-being', () => {
  const home = (state: GameState) => state.buildings.find((b) => b.type === 'home')!;
  const nearHome = { buildings: [{ ...createBuilding(1, 'home', 52, 52, 0), tier: 6 }, createBuilding(100, 'marina', 50, 48, 0)] };

  it('raises the Well-being of Homes within reach', () => {
    const without = harbour(nearHome);
    const withBoat = succeed(without, buy(52));
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBeGreaterThan(homeBenefits(without, home(without)).wellbeing);
  });

  it('has no effect on far Homes', () => {
    const without = harbour();
    const withBoat = succeed(without, buy(52));
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBe(homeBenefits(without, home(without)).wellbeing);
  });

  it('stops when the running cost cannot be paid', () => {
    const without = harbour({ ...nearHome, urbs: 0 });
    const withBoat = { ...without, boats: [{ id: 200, family: 'pleasure' as const, marinaId: 100, x: 52, y: 50 }] };
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBe(homeBenefits(without, home(without)).wellbeing);
  });
});

describe('Pleasure boat running cost', () => {
  it('takes 2 Urbs per hour from the city', () => {
    const idle = harbour();
    const boated = succeed(idle, buy(52));
    const days = 3 * HOUR;
    const spent = advance(idle, T0 + days).state.urbs - advance(boated, T0 + days).state.urbs;
    expect(spent - 400).toBeCloseTo(6);
  });

  it('never drives the balance below zero', () => {
    const state = succeed(harbour({ urbs: 400 }), buy(52));
    expect(advance(state, T0 + 10 * HOUR).state.urbs).toBeGreaterThanOrEqual(0);
  });
});

describe('Protecting the Marina and the water', () => {
  it('refuses to sell or move a Marina that holds Boats', () => {
    const state = succeed(harbour(), buy(52));
    expect(failureKey(state, { type: 'SellBuilding', id: 100 })).toBe('error.marinaInUse');
    expect(failureKey(state, { type: 'MoveBuilding', id: 100, x: 53, y: 48 })).toBe('error.marinaInUse');
    expect(failureKey(succeed(state, { type: 'SellBoat', id: 200 }), { type: 'SellBuilding', id: 100 })).toBeNull();
  });

  it('refuses to remove the Water tile under a Boat', () => {
    const state = succeed(harbour(), buy(52));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 52, y: 50 }] })).toBe('error.waterInUse');
  });

  it('refuses to remove a Water tile that would cut a Boat off its Marina', () => {
    const state = succeed(harbour({ waterTiles: [...row(4, 50), { x: 53, y: 51 }, { x: 54, y: 51 }] }), buy(54, 51));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 53, y: 51 }] })).toBe('error.waterInUse');
  });

  it('removes the free Water tiles of a drag and keeps the others', () => {
    const state = succeed(harbour(), buy(52));
    const after = succeed(state, { type: 'RemoveWater', tiles: row(6) });
    expect(after.waterTiles).toEqual([{ x: 51, y: 50 }, { x: 52, y: 50 }]);
  });
});
