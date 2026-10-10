import { describe, expect, it } from 'vitest';
import { PRODUCTION_UPGRADE_COSTS, createBuilding, dispatch, farmTier, maxTierOf, newGame, upgradeCostOf, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function withCitizens(state: GameState, tier: number): GameState {
  return { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, { ...createBuilding(state.nextId, 'home', 40, 40, 0), tier }] };
}

const placeFarm: Command = { type: 'PlaceBuilding', buildingType: 'farm', x: 56, y: 59 };
const city = { ...newGame({ seed: 'farm-spec', now: T0 }), urbs: 10_000 };

describe('Farm building', () => {
  it('is locked below 20 Citizens', () => {
    expect(failureKey(city, placeFarm)).toBe('error.itemLocked');
  });

  it('costs 200 Urbs on a 2x2 footprint once 20 Citizens live in the city', () => {
    const result = dispatch(withCitizens(city, 3), placeFarm, T0);
    if (!result.ok) throw new Error(result.error.key);
    const farm = result.state.buildings.find(b => b.type === 'farm');
    expect(farm).toMatchObject({ x: 56, y: 59, tier: 1 });
    expect(result.state.urbs).toBe(withCitizens(city, 3).urbs - 200);
  });

  it('allows a single Farm per city', () => {
    const built = dispatch(withCitizens(city, 3), placeFarm, T0);
    if (!built.ok) throw new Error(built.error.key);
    expect(failureKey(built.state, { ...placeFarm, x: 60, y: 59 })).toBe('error.farmExists');
  });

  it('follows the Farm tier table for seed stock and Field cap', () => {
    expect([1, 2, 3, 4, 5].map(tier => farmTier({ type: 'farm', tier }))).toEqual([
      { seedCapacity: 20, fieldCap: 12 },
      { seedCapacity: 40, fieldCap: 24 },
      { seedCapacity: 70, fieldCap: 40 },
      { seedCapacity: 110, fieldCap: 60 },
      { seedCapacity: 160, fieldCap: 90 },
    ]);
  });

  it('reuses the production upgrade costs up to Tier 5', () => {
    expect(maxTierOf('farm')).toBe(5);
    for (const tier of [2, 3, 4, 5]) expect(upgradeCostOf('farm', tier)).toEqual(PRODUCTION_UPGRADE_COSTS[tier]);
  });

  it('starts a new game with an empty seed stock', () => {
    expect(city.seedStock).toEqual({});
  });
});
