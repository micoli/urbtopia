import { describe, expect, it } from 'vitest';
import { buyableParcels, dispatch, newGame, parcelPrice, type Command, type GameState } from '../index';

const NOW = 1_700_000_000_000;
const initial: GameState = { ...newGame({ seed: 'amber-fox-4821', now: NOW }), urbs: 1_000_000 };

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, NOW);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, NOW);
  return result.ok ? null : result.error.key;
}

const buy = (x: number, y: number): Command => ({ type: 'BuyParcel', x, y });

describe('parcelPrice', () => {
  it('costs 300 Urbs x 1.12^n rounded to ten, n being the Parcels bought so far', () => {
    expect(parcelPrice(initial)).toBe(300);
    const prices = [];
    let state = initial;
    const purchases: [number, number][] = [[2, 3], [1, 3], [0, 3]];
    for (const [x, y] of purchases) {
      state = succeed(state, buy(x, y));
      prices.push(parcelPrice(state));
    }
    expect(prices).toEqual([340, 380, 420]);
  });

  it('reaches about 930, 8,990 and 240,430 Urbs after 10, 30 and 59 purchases', () => {
    const owned = (count: number) => Array.from({ length: 4 + count }, (_, index) => ({ x: index, y: 0 }));
    expect(parcelPrice({ ...initial, ownedParcels: owned(10) })).toBe(930);
    expect(parcelPrice({ ...initial, ownedParcels: owned(30) })).toBe(8990);
    expect(parcelPrice({ ...initial, ownedParcels: owned(59) })).toBe(240430);
  });
});

describe('BuyParcel', () => {
  it('adds an adjacent Parcel and charges its price', () => {
    const state = succeed(initial, buy(2, 3));
    expect(state.ownedParcels).toContainEqual({ x: 2, y: 3 });
    expect(state.urbs).toBe(initial.urbs - 300);
  });

  it('refuses a Parcel that is not next to an owned Parcel, including diagonally', () => {
    expect(failureKey(initial, buy(0, 0))).toBe('error.parcelNotAdjacent');
    expect(failureKey(initial, buy(2, 2))).toBe('error.parcelNotAdjacent');
  });

  it('refuses a Parcel that is already owned or outside the map', () => {
    expect(failureKey(initial, buy(3, 3))).toBe('error.parcelOwned');
    expect(failureKey(initial, buy(-1, 3))).toBe('error.outsideMap');
    expect(failureKey(succeed(initial, buy(5, 3)), buy(8, 3))).toBe('error.outsideMap');
  });

  it('refuses when Urbs are missing', () => {
    expect(failureKey({ ...initial, urbs: 299 }, buy(2, 3))).toBe('error.notEnoughUrbs');
  });

  it('makes the new land buildable at once', () => {
    const state = succeed(initial, buy(2, 3));
    const placed = succeed(state, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 40, y: 50 });
    expect(placed.buildings.some((b) => b.type === 'powerPlant')).toBe(true);
  });
});

describe('buyableParcels', () => {
  it('lists the 8 Parcels around the starting 2x2 block', () => {
    expect(buyableParcels(initial)).toHaveLength(8);
  });

  it('stops listing a Parcel once it is owned', () => {
    const state = succeed(initial, buy(2, 3));
    expect(buyableParcels(state)).not.toContainEqual({ x: 2, y: 3 });
    expect(buyableParcels(state)).toContainEqual({ x: 1, y: 3 });
  });
});
