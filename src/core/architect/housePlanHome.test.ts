import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from '../index';
import { isPlanUnlockedAt } from './architectTiers';
import { designCostOf, housePlanTypeOf, housePlanSize } from './houseDesign';
import { GRID, newPlan, toggleCell } from './housePlan';

const T0 = 1_700_000_000_000;

const result = (state: GameState, command: Command) => dispatch(state, command, T0);

const plan = newPlan('L');
const design = { name: 'Villa', plan };
const type = housePlanTypeOf(plan);
const base = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 100_000 };
const powered = (() => {
  let state = base;
  for (const command of [{ type: 'PlaceBuilding', buildingType: 'powerPlant', x: 70, y: 70 }, { type: 'PlaceBuilding', buildingType: 'waterTower', x: 72, y: 70 }] as Command[]) {
    const placed = result(state, command);
    if (!placed.ok) throw new Error(placed.error.key);
    state = placed.state;
  }
  return state;
})();

// The first spot of the starting parcels where the house fits.
const spot = (() => {
  for (let y = 50; y < 62; y++) for (let x = 50; x < 62; x++) if (result(powered, { type: 'PlaceBuilding', buildingType: type as never, x, y, design }).ok) return { x, y };
  throw new Error('no spot');
})();

describe('a house plan built as a Home', () => {
  it('takes the footprint of its plan, its price from the plan, and keeps the plan', () => {
    const { width, depth } = housePlanSize(plan);
    expect(type).toBe(`housePlan-${width}x${depth}`);
    const placed = result(powered, { type: 'PlaceBuilding', buildingType: type as never, ...spot, design });
    if (!placed.ok) throw new Error(placed.error.key);
    const house = placed.state.buildings.find((building) => building.design);
    expect(house?.design).toEqual(design);
    expect(placed.state.urbs).toBe(powered.urbs - designCostOf(design));
  });

  it('refunds part of the price of the plan when sold', () => {
    const placed = result(powered, { type: 'PlaceBuilding', buildingType: type as never, ...spot, design });
    if (!placed.ok) throw new Error(placed.error.key);
    const id = placed.state.buildings.find((building) => building.design)!.id;
    const sold = result(placed.state, { type: 'SellBuilding', id });
    if (!sold.ok) throw new Error(sold.error.key);
    expect(sold.state.urbs).toBeGreaterThan(placed.state.urbs);
    expect(sold.state.urbs).toBeLessThan(powered.urbs);
  });

  it('refuses a plan that does not match the type, a plan home without a plan and a plan on another type', () => {
    const other = { ...plan, floors: plan.floors.map((floor) => floor.map((row) => [...row])) };
    toggleCell(other, 0, 0, 0);
    expect(housePlanTypeOf(other)).not.toBe(type);
    const key = (command: Command) => { const outcome = result(powered, command); return outcome.ok ? null : outcome.error.key; };
    expect(key({ type: 'PlaceBuilding', buildingType: type as never, ...spot, design: { name: 'x', plan: other } })).toBe('error.invalidHousePlan');
    expect(key({ type: 'PlaceBuilding', buildingType: type as never, ...spot })).toBe('error.invalidHousePlan');
    expect(key({ type: 'PlaceBuilding', buildingType: 'home', ...spot, design })).toBe('error.invalidHousePlan');
  });

  describe('linked to its saved plan', () => {
    const saved = (() => {
      const outcome = result(powered, { type: 'SaveHousePlan', name: 'Villa', plan });
      if (!outcome.ok) throw new Error(outcome.error.key);
      return outcome.state;
    })();
    const linked = { ...design, planId: 1 };
    const built = (() => {
      const outcome = result(saved, { type: 'PlaceBuilding', buildingType: type as never, ...spot, design: linked });
      if (!outcome.ok) throw new Error(outcome.error.key);
      return outcome.state;
    })();
    const designOfHouse = (state: GameState) => state.buildings.find((building) => building.design)?.design;

    it('follows the plan when it is saved again with the same footprint', () => {
      const edited = structuredClone(plan);
      edited.wallColor = '#f1f1f6';
      const outcome = result(built, { type: 'SaveHousePlan', name: 'Villa', plan: edited });
      if (!outcome.ok) throw new Error(outcome.error.key);
      expect(designOfHouse(outcome.state)?.plan).toEqual(edited);
      expect(designOfHouse(outcome.state)?.planId).toBe(1);
    });

    const grown = (() => {
      const { width, depth } = housePlanSize(plan);
      for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
        const candidate = structuredClone(plan);
        toggleCell(candidate, 0, c, r);
        const size = housePlanSize(candidate);
        if (size.depth > depth && size.width <= width && isPlanUnlockedAt(candidate, 1)) return candidate;
      }
      throw new Error('no grown plan');
    })();

    const shrunk = (() => {
      const candidate = structuredClone(plan);
      const columns = candidate.floors[0]!.flatMap((row) => row.flatMap((on, c) => (on ? [c] : [])));
      const last = Math.max(...columns);
      for (const floor of candidate.floors) for (const row of floor) for (let c = last - 1; c <= last; c++) row[c] = false;
      return candidate;
    })();

    it('refuses a save that would grow the footprint beyond the built house', () => {
      const outcome = result(built, { type: 'SaveHousePlan', name: 'Villa', plan: grown });
      expect(outcome.ok ? null : outcome.error.key).toBe('error.housePlanFootprintInUse');
    });

    it('follows a plan saved with a smaller footprint, on the same tiles', () => {
      const smaller = shrunk;
      const outcome = result(built, { type: 'SaveHousePlan', name: 'Villa', plan: smaller });
      if (!outcome.ok) throw new Error(outcome.error.key);
      expect(designOfHouse(outcome.state)?.plan).toEqual(smaller);
      expect(outcome.state.buildings.find((building) => building.design)?.type).toBe(type);
    });

    it('keeps its own copy, detached, when the plan is deleted', () => {
      const outcome = result(built, { type: 'DeleteHousePlan', id: 1 });
      if (!outcome.ok) throw new Error(outcome.error.key);
      expect(designOfHouse(outcome.state)?.plan).toEqual(plan);
      expect(designOfHouse(outcome.state)?.planId).toBeUndefined();
    });

    it('refuses to be built from an unknown plan', () => {
      const outcome = result(powered, { type: 'PlaceBuilding', buildingType: type as never, ...spot, design: linked });
      expect(outcome.ok ? null : outcome.error.key).toBe('error.unknownHousePlan');
    });
  });
});
