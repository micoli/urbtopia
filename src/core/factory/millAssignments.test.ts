import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fixtureLimitOf, focusGoodsOf, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';
import { interiorLinksOf } from './factoryInterior';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'mill-assignments', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'mill', 55, 50, 0), tier: 3 }],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const mill = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const remove = (fixtureId: number): Command => ({ type: 'RemoveInteriorFixture', buildingId: 1, fixtureId });
const focus = (fixtureId: number, good: string | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good: good as GoodId | null });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
// Flour and olive oil are Materials: they are stored with the Materials of the Storehouse.
const storedOf = (state: GameState, item: string): number => (state.storage.materials as Record<string, number>)[item] ?? 0;
const idOf = (state: GameState, type: FixtureId): number => mill(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;

// A Motor and a Shaft drive the Millstone, a second Motor drives the Pump, and the Pump pushes through the Pipes to a Cleaner, the Millstone, a Bagger and an Oil tank.
const schema = [place('millMotor', 2, 2), place('millShaft', 2, 3), place('millstone', 2, 4, 2), place('millMotor', 4, 6, 2), place('millPump', 4, 5, 1), place('millPipeCross', 3, 5), place('millPipeCross', 2, 5),
  place('millPipe', 1, 5, 1), place('millCleaner', 0, 5, 1), place('millBagger', 2, 6, 2), place('millOilTank', 3, 4)];

describe('the Millstone of a Mill interior', () => {
  const fitted = apply(city(), ...schema);
  const stone = idOf(fitted, 'millstone');

  it('offers the wheat and the olives to grind', () => {
    const goods = focusGoodsOf(mill(fitted), mill(fitted).interior!.fixtures.find(fixture => fixture.id === stone)!);
    expect(goods).toEqual(expect.arrayContaining(['flour', 'oliveOil']));
  });

  it('is complete once the Pipes of the Pump reach a Cleaner and the destination of its Recipe', () => {
    const flour = apply(fitted, focus(stone, 'flour'));
    expect(interiorLinksOf(mill(flour).interior!.fixtures).lined.has(stone)).toBe(true);
    const oil = apply(fitted, focus(stone, 'oliveOil'));
    expect(interiorLinksOf(mill(oil).interior!.fixtures).lined.has(stone)).toBe(true);
  });

  it('is not complete without a Recipe', () => {
    expect(interiorLinksOf(mill(fitted).interior!.fixtures).lined.has(stone)).toBe(false);
  });

  it('is not complete without a Cleaner or without the destination of its Recipe', () => {
    const flour = apply(fitted, focus(stone, 'flour'));
    const noCleaner = apply(flour, remove(idOf(flour, 'millCleaner')));
    expect(interiorLinksOf(mill(noCleaner).interior!.fixtures).lined.has(stone)).toBe(false);
    const noBagger = apply(flour, remove(idOf(flour, 'millBagger')));
    expect(interiorLinksOf(mill(noBagger).interior!.fixtures).lined.has(stone)).toBe(false);
    const oil = apply(noBagger, focus(stone, 'oliveOil'));
    expect(interiorLinksOf(mill(oil).interior!.fixtures).lined.has(stone)).toBe(true);
  });

  it('is not complete when the Pump is not driven', () => {
    const flour = apply(fitted, focus(stone, 'flour'), remove(mill(fitted).interior!.fixtures.filter(fixture => fixture.type === 'millMotor')[1]!.id));
    expect(interiorLinksOf(mill(flour).interior!.fixtures).lined.has(stone)).toBe(false);
  });

  it('takes a miller, one to one', () => {
    const hired = apply(fitted, { type: 'HireInteriorStaff', buildingId: 1, role: 'miller' });
    expect(failure(hired, assign(stone))).toBe('error.noFocus');
    const assigned = apply(hired, focus(stone, 'flour'), assign(stone));
    expect(assignedFixturesOf(mill(assigned).interior, 'miller').map(fixture => fixture.id)).toEqual([stone]);
    expect(failure(assigned, assign(stone))).toBe('error.staffAlreadyAssigned');
  });
});

describe('the miller of a Mill interior at work on its own', () => {
  const HOUR = 3_600_000;
  const STEP = 60_000;
  const stocked = (): GameState => {
    const state = apply(city(), ...schema);
    const materials: Record<string, number> = {};
    for (const good of ['flour', 'oliveOil'] as const) for (const [material, amount] of Object.entries(recipeOf(good))) materials[material] = (materials[material] ?? 0) + amount * 100;
    return { ...state, adaptationUntil: 100 * HOUR, buildings: [...state.buildings, createBuilding(2, 'storehouse', 70, 50, 0)], storage: { ...state.storage, materials: { ...state.storage.materials, ...materials } } };
  };
  const working = (good: string): GameState => {
    const state = stocked();
    return apply(state, { type: 'HireInteriorStaff', buildingId: 1, role: 'miller' }, focus(idOf(state, 'millstone'), good), assign(idOf(state, 'millstone')));
  };
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };

  it('does nothing on its own without a miller assigned', () => {
    const state = stocked();
    const idle = run(apply(state, focus(idOf(state, 'millstone'), 'flour')), HOUR);
    expect(mill(idle).queue).toHaveLength(0);
  });

  it('grinds flour on its own and stores it', () => {
    const later = run(working('flour'), 6 * HOUR);
    expect(storedOf(later, 'flour')).toBeGreaterThan(0);
  });

  it('presses olive oil on its own and stores it', () => {
    const later = run(working('oliveOil'), 6 * HOUR);
    expect(storedOf(later, 'oliveOil')).toBeGreaterThan(0);
  });

  it('waits when the schema is incomplete', () => {
    const state = working('flour');
    const broken = apply(state, remove(idOf(state, 'millBagger')));
    expect(mill(run(broken, HOUR)).queue).toHaveLength(0);
  });

  it('stays valid as a save while the miller is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working('flour'), 5 * STEP)))).ok).toBe(true);
  });
});

describe('a Mill interior with no Pipe at all', () => {
  // The Pump pushes into the Cleaner, which hands the Flow to the Millstone, which hands it to the Oil tank.
  const chain = [place('millMotor', 2, 1), place('millstone', 2, 2, 2), place('millCleaner', 2, 3), place('millOilTank', 3, 2, 1), place('millPump', 2, 4, 2), place('millMotor', 1, 4, 3)];

  it('is complete when each output faces the input of the next Machine', () => {
    const state = apply(city(), ...chain);
    const stone = idOf(state, 'millstone');
    const oil = apply(state, focus(stone, 'oliveOil'));
    expect(interiorLinksOf(mill(oil).interior!.fixtures).lined.has(stone)).toBe(true);
    expect(interiorLinksOf(mill(apply(state, focus(stone, 'flour'))).interior!.fixtures).lined.has(stone)).toBe(false);
  });

  it('is not complete when the Tank does not face the Millstone', () => {
    const state = apply(city(), ...chain.slice(0, 3), place('millOilTank', 3, 2, 2), ...chain.slice(4));
    const stone = idOf(state, 'millstone');
    expect(interiorLinksOf(mill(apply(state, focus(stone, 'oliveOil'))).interior!.fixtures).lined.has(stone)).toBe(false);
  });
});

describe('a Mill interior whose Cleaner stands behind the Pump', () => {
  // The Pump draws from the Cleaner at its back and pushes into the Millstone, which hands the Flow to the Oil tank.
  const drawn = [place('millMotor', 4, 2, 1), place('millstone', 3, 2, 3), place('millCleaner', 1, 2, 3), place('millOilTank', 3, 3, 2), place('millPump', 2, 2, 3), place('millMotor', 2, 1)];

  it('is complete', () => {
    const state = apply(city(), ...drawn);
    const stone = idOf(state, 'millstone');
    expect(interiorLinksOf(mill(apply(state, focus(stone, 'oliveOil'))).interior!.fixtures).lined.has(stone)).toBe(true);
  });
});

describe('the Millstones a Mill interior takes', () => {
  const stones = (tier: number): GameState => {
    const state = city();
    return { ...state, buildings: state.buildings.map(building => (building.id === 1 ? { ...building, tier, slotCount: 2 } : building)) };
  };
  const limit = (tier: number) => fixtureLimitOf(mill(stones(tier)), 'millstone')!.max;

  it('follow the production Slots, with one more at the fourth Tier and two more at the fifth', () => {
    expect([1, 2, 3, 4, 5].map(limit)).toEqual([2, 2, 2, 3, 4]);
  });
});
