import { describe, expect, it } from 'vitest';
import { allowedCopies, createBuilding, dispatch, fieldCap, maxCopies, newGame, nextCopyCost, seedStockCapacity, storageCapacity, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

function homesWith(state: GameState, citizens: number): GameState {
  const home = { ...createBuilding(state.nextId, 'home', 40, 40, 0), tier: 8 };
  const withHome = { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, home] };
  return citizens > 0 ? withHome : state;
}

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

const place = (buildingType: 'storehouse' | 'farm', x: number): Command => ({ type: 'PlaceBuilding', buildingType, x, y: 59 });
const rich = { ...newGame({ seed: 'build-limit', now: T0 }), urbs: 1_000_000 };
const populated = homesWith(rich, 1);

describe('Build limit', () => {
  it('allows one copy in an empty city and three at most', () => {
    expect(allowedCopies(rich, 'storehouse')).toBe(1);
    expect(maxCopies('storehouse')).toBe(3);
  });

  it('opens the next copy once the city has enough Citizens', () => {
    const first = succeed(populated, place('storehouse', 56));
    expect(allowedCopies(first, 'storehouse')).toBeGreaterThan(1);
    expect(failureKey(first, place('storehouse', 58))).toBeNull();
  });

  it('doubles the price for each copy already built', () => {
    const first = succeed(populated, place('storehouse', 56));
    expect(nextCopyCost(populated, 'storehouse')).toBe(400);
    expect(nextCopyCost(first, 'storehouse')).toBe(800);
    expect(succeed(first, place('storehouse', 58)).urbs).toBe(first.urbs - 800);
  });

  it('adds the capacity of every copy', () => {
    const two = succeed(succeed(populated, place('storehouse', 56)), place('storehouse', 58));
    expect(storageCapacity(two).materials).toBe(40);
    expect(storageCapacity(two).goods).toBe(80);
  });

  it('adds up the seed capacity and Field cap of several Farms', () => {
    const one = succeed(populated, place('farm', 56));
    const two = succeed(one, place('farm', 60));
    expect(seedStockCapacity(two)).toBe(2 * seedStockCapacity(one));
    expect(fieldCap(two)).toBe(2 * fieldCap(one));
  });
});
