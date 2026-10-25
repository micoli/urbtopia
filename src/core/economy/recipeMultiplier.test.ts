import { describe, expect, it } from 'vitest';
import { dispatch, newGame, recipeMultiplierOf, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';

const T0 = 1_700_000_000_000;

const base = newGame({ seed: 'recipe-multiplier', now: T0 });
const city = (type: 'bakery' | 'workshop', tier: number): { state: GameState; id: number } => {
  const building = { ...createBuilding(900, type, 56, 57, 0), tier };
  return { state: { ...base, buildings: [...base.buildings, { ...createBuilding(901, 'home', 40, 40, 0), tier: 5 }, building], storage: { materials: { flour: 1, apple: 1, wood: 1 }, goods: {} } }, id: building.id };
};

describe('recipe multiplier', () => {
  it('is the yield of a Bakery and 1 elsewhere', () => {
    expect(recipeMultiplierOf(city('bakery', 3).state.buildings.at(-1)!)).toBe(1);
    expect(recipeMultiplierOf(city('bakery', 4).state.buildings.at(-1)!)).toBe(2);
    expect(recipeMultiplierOf(city('workshop', 5).state.buildings.at(-1)!)).toBe(1);
  });

  it('asks a Tier 4 Bakery for two recipes per cycle', () => {
    const { state, id } = city('bakery', 4);
    const result = dispatch(state, { type: 'QueueProduction', buildingId: id, item: 'appleCake' }, T0);
    expect(result.ok ? null : result.error.key).toBe('error.missingMaterials');
    const stocked = { ...state, storage: { materials: { flour: 2, apple: 2 }, goods: {} } };
    const queued = dispatch(stocked, { type: 'QueueProduction', buildingId: id, item: 'appleCake' }, T0);
    expect(queued.ok && queued.state.storage.materials).toEqual({ flour: 0, apple: 0 });
  });
});
