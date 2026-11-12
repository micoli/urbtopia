import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, repairCost, fixtureLimitOf, interiorBonusOfBuilding, interiorWagesPerHour, stackCountOf, createBuilding, dispatch, focusGoodsOf, freeStaffOf, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'bakery-assignments', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'bakery', 55, 50, 0), tier: 5 }],
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
const bakery = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const hire = (role: 'baker' | 'seller'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const release = (role: 'baker' | 'seller'): Command => ({ type: 'ReleaseInteriorStaff', buildingId: 1, role });
const focus = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
const unassign = (fixtureId: number): Command => ({ type: 'UnassignInteriorStaff', buildingId: 1, fixtureId });
const idOf = (state: GameState, type: FixtureId, nth = 0): number => bakery(state).interior!.fixtures.filter(fixture => fixture.type === type)[nth]!.id;
const fixtureOf = (state: GameState, id: number) => bakery(state).interior!.fixtures.find(fixture => fixture.id === id)!;

describe('the Staff assigned in a Bakery interior', () => {
  // A Line from a Mixer through an Oven to two Display counters, and another Oven that feeds nothing.
  const drive = [place('bakeryShaft', 5, 0, 1), place('bakeryMotor', 6, 0, 1)];
  const gas = [place('bakeryTank', 2, 2, 3), place('bakeryPump', 3, 2, 3), place('bakeryMotor', 3, 1, 0)];
  const fitted = apply(city(), place('bakeryMixer', 4, 0), ...drive, ...gas, place('bakeryConveyor', 4, 1), place('bakeryOven', 4, 2), place('bakeryConveyorSplitStraightLeft', 4, 3),
    place('bakeryCounter', 3, 3, 3), place('bakeryCounter', 4, 4, 2), place('bakeryOvenRight', 8, 8));
  const [ovenA, ovenB] = [idOf(fitted, 'bakeryOven'), idOf(fitted, 'bakeryOvenRight')];
  const [counterA, counterB] = [idOf(fitted, 'bakeryCounter', 0), idOf(fitted, 'bakeryCounter', 1)];
  const baking = apply(fitted, focus(ovenA, 'bread'));

  it('offers an Oven the Goods the Bakery produces, and a Display counter only what the Ovens upstream of it bake', () => {
    expect(focusGoodsOf(bakery(fitted), fixtureOf(fitted, ovenA))).toContain('bread');
    expect(focusGoodsOf(bakery(fitted), fixtureOf(fitted, counterA))).toEqual([]);
    expect(focusGoodsOf(bakery(baking), fixtureOf(baking, counterA))).toEqual(['bread']);
    const two = apply(baking, focus(ovenB, 'fougasse'));
    expect(focusGoodsOf(bakery(two), fixtureOf(two, counterA))).toEqual(['bread']);
  });

  it('refuses a Sold Good that no Oven upstream bakes', () => {
    expect(failure(fitted, focus(counterA, 'bread'))).toBe('error.notUpstream');
    expect(failure(baking, focus(counterA, 'fougasse'))).toBe('error.notUpstream');
    expect(failure(baking, focus(counterA, 'bread'))).toBeNull();
  });

  it('asks for a Recipe before it takes a baker, and for a hired baker that is free', () => {
    expect(failure(fitted, assign(ovenA))).toBe('error.noFocus');
    expect(failure(baking, assign(ovenA))).toBe('error.noFreeStaff');
  });

  it('refuses a Good the Fixture does not work on and a Fixture that takes no Staff', () => {
    expect(failure(baking, focus(counterA, 'cheese'))).toBe('error.cannotProduce');
    expect(failure(fitted, focus(ovenA, 'cheese'))).toBe('error.cannotProduce');
    const motor = apply(fitted, place('bakeryMotor', 0, 5));
    expect(failure(motor, focus(idOf(motor, 'bakeryMotor'), 'bread'))).toBe('error.notAssignable');
  });

  it('assigns one Staff to one Fixture, and one Fixture to one Staff', () => {
    const baked = apply(fitted, hire('baker'), focus(ovenA, 'bread'), focus(ovenB, 'fougasse'), assign(ovenA));
    expect(assignedFixturesOf(bakery(baked).interior, 'baker').map(fixture => fixture.id)).toEqual([ovenA]);
    expect(freeStaffOf(bakery(baked), 'baker')).toBe(0);
    expect(failure(baked, assign(ovenA))).toBe('error.staffAlreadyAssigned');
    expect(failure(baked, assign(ovenB))).toBe('error.noFreeStaff');
  });

  it('frees the Staff when it is unassigned, when its Good is cleared, when the Fixture moves or is sold, or when the Staff is released', () => {
    const working = apply(baking, hire('seller'), focus(counterA, 'bread'), assign(counterA));
    expect(fixtureOf(apply(working, unassign(counterA)), counterA).assigned).toBeUndefined();
    expect(fixtureOf(apply(working, focus(counterA, null)), counterA)).not.toHaveProperty('soldGood');
    expect(fixtureOf(apply(working, focus(counterA, null)), counterA).assigned).toBeUndefined();
    const moved = apply(working, { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: counterA, x: 1, y: 6, rotation: 0 });
    expect(fixtureOf(moved, counterA)).toMatchObject({ soldGood: 'bread' });
    expect(fixtureOf(moved, counterA).assigned).toBeUndefined();
    expect(freeStaffOf(bakery(moved), 'seller')).toBe(1);
    expect(freeStaffOf(bakery(apply(working, { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: counterA })), 'seller')).toBe(1);
    expect(fixtureOf(apply(working, release('seller')), counterA).assigned).toBeUndefined();
  });

  it('keeps the other assignments when a Staff is released and another is still needed', () => {
    const two = apply(baking, hire('seller'), hire('seller'), focus(counterA, 'bread'), focus(counterB, 'bread'), assign(counterA), assign(counterB));
    const released = apply(two, release('seller'));
    expect(assignedFixturesOf(bakery(released).interior, 'seller')).toHaveLength(1);
  });

  it('adds no sales for a Sold Good that its Ovens stopped baking', () => {
    const selling = apply(baking, hire('seller'), focus(counterA, 'bread'), assign(counterA));
    expect(interiorBonusOfBuilding(bakery(selling), 'bread').sales).toBeGreaterThan(0);
    const changed = apply(selling, focus(ovenA, 'fougasse'));
    expect(interiorBonusOfBuilding(bakery(changed), 'bread').sales).toBe(0);
  });

  it('survives a save, and refuses an assignment that no Staff covers', () => {
    const saved = JSON.parse(JSON.stringify(apply(fitted, hire('baker'), focus(ovenA, 'bread'), assign(ovenA))));
    expect(checkGameState(saved).ok).toBe(true);
    const uncovered = JSON.parse(JSON.stringify(apply(fitted, hire('baker'), focus(ovenA, 'bread'), assign(ovenA))));
    uncovered.buildings.find((building: Building) => building.id === 1).interior.staff = {};
    expect(checkGameState(uncovered).ok).toBe(false);
    const wrongGood = JSON.parse(JSON.stringify(apply(fitted, hire('baker'), focus(ovenA, 'bread'))));
    wrongGood.buildings.find((building: Building) => building.id === 1).interior.fixtures.find((fixture: { id: number }) => fixture.id === ovenA).soldGood = 'bread';
    expect(checkGameState(wrongGood).ok).toBe(false);
  });
});

describe('the Staff assigned in a Bakery interior at work on its own', () => {
  const HOUR = 3_600_000;
  // A Mixer against the back wall with its Drive, an Oven with its gas, and a Line to a Display counter.
  const drive = [place('bakeryShaft', 5, 0, 1), place('bakeryMotor', 6, 0, 1)];
  const gas = [place('bakeryTank', 2, 2, 3), place('bakeryPump', 3, 2, 3), place('bakeryMotor', 3, 1, 0)];
  const line = [place('bakeryConveyor', 4, 1), place('bakeryOven', 4, 2), place('bakeryConveyor', 4, 3), place('bakeryConveyor', 4, 4), place('bakeryConveyor', 4, 5), place('bakeryConveyor', 4, 6), place('bakeryCounter', 4, 7, 2)];
  const stocked = (): GameState => {
    const state = apply(city(), place('bakeryMixer', 4, 0), ...drive, ...gas, ...line);
    const materials = Object.fromEntries(Object.entries(recipeOf('bread')).map(([material, amount]) => [material, amount * 100]));
    return { ...state, adaptationUntil: 100 * HOUR, buildings: [...state.buildings, createBuilding(2, 'storehouse', 70, 50, 0)], storage: { ...state.storage, materials: { ...state.storage.materials, ...materials } } };
  };
  const working = (): GameState => {
    const state = stocked();
    return apply(state, hire('baker'), hire('seller'), focus(idOf(state, 'bakeryOven'), 'bread'), focus(idOf(state, 'bakeryCounter'), 'bread'), assign(idOf(state, 'bakeryOven')), assign(idOf(state, 'bakeryCounter')));
  };
  const STEP = 60_000;
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };

  it('does nothing on its own without a baker assigned to the Oven', () => {
    const idle = run(stocked(), HOUR);
    expect(bakery(idle).queue).toHaveLength(0);
    expect(idle.storage.goods.bread ?? 0).toBe(0);
  });

  it('bakes the Recipe over and over and stores it, and the seller stocks and sells it over the Counter', () => {
    const later = run(working(), 6 * HOUR);
    expect((later.storage.goods.bread ?? 0) + bakery(later).stacks.reduce((total, stack) => total + (stack.good === 'bread' ? stack.stock : 0), 0)).toBeGreaterThan(0);
    const wages = interiorWagesPerHour(bakery(working())) * 6;
    expect(later.urbs).toBeGreaterThan(working().urbs - wages);
  });

  it('stays valid as a save while the baker is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working(), 5 * STEP)))).ok).toBe(true);
  });

  it('keeps one production of the Recipe in the queue, and the last Slot for the player', () => {
    const state = run(working(), 5 * STEP);
    expect(bakery(state).queue.filter(entry => entry.item === 'bread').length).toBeLessThanOrEqual(1);
    expect(bakery(state).queue.length).toBeLessThan(bakery(state).slotCount);
  });
});

describe('the Ovens and the Display counters of a Bakery are limited by its Slots', () => {
  const fresh = (tier = 5): GameState => ({ ...city(), buildings: city().buildings.map(building => (building.id === 1 ? { ...building, tier } : building)) });
  const counterSlots = (tier: number) => stackCountOf('bakery', tier);

  it('has more Counter Slots with the Tier', () => {
    expect([1, 2, 3, 4, 5].map(counterSlots)).toEqual([3, 3, 4, 4, 5]);
  });

  it('allows as many Ovens as production Slots and as many Display counters as Counter Slots', () => {
    expect(bakery(fresh()).slotCount).toBe(2);
    const ovens = apply(fresh(), place('bakeryOven', 2, 3), place('bakeryOvenRight', 3, 3));
    expect(failure(ovens, place('bakeryOven', 4, 3))).toBe('error.fixtureLimitReached');
    expect(failure(ovens, place('bakeryOvenRight', 4, 3))).toBe('error.fixtureLimitReached');
    const placed = (tier: number) => apply(fresh(tier), ...Array.from({ length: counterSlots(tier) }, (_, column) => place('bakeryCounter', column, 5)));
    expect(failure(placed(1), place('bakeryCounter', 5, 5))).toBe('error.fixtureLimitReached');
    expect(failure(placed(5), place('bakeryCounter', 5, 4))).toBe('error.fixtureLimitReached');
    expect(bakery(placed(5)).interior!.fixtures).toHaveLength(5);
  });

  it('allows one more Oven for each production Slot bought, and counts what is placed', () => {
    const bought = send(fresh(), { type: 'BuySlot', buildingId: 1 });
    const ovens = apply(bought, place('bakeryOven', 2, 3), place('bakeryOven', 3, 3), place('bakeryOven', 4, 3));
    expect(fixtureLimitOf(bakery(ovens), 'bakeryOven')).toEqual({ count: 3, max: 3 });
    expect(fixtureLimitOf(bakery(fresh()), 'bakeryCounter')).toEqual({ count: 0, max: 5 });
    expect(fixtureLimitOf(bakery(fresh(1)), 'bakeryCounter')).toEqual({ count: 0, max: 3 });
    expect(fixtureLimitOf(bakery(fresh()), 'bakeryMotor')).toBeUndefined();
  });

  it('adds the Counter Slots to a Bakery that is upgraded', () => {
    const ready = { ...fresh(1), urbs: 1_000_000, storage: { ...fresh(1).storage, goods: { planks: 99, bricks: 99, tiles: 99, tools: 99 } } };
    const upgraded = apply(ready, { type: 'UpgradeBuilding', buildingId: 1 }, { type: 'UpgradeBuilding', buildingId: 1 });
    expect(bakery(upgraded).tier).toBe(3);
    expect(bakery(upgraded).stacks).toHaveLength(4);
  });

  it('leaves the other interiors without such a limit', () => {
    const packhouse = { ...fresh(), buildings: [{ ...createBuilding(2, 'packhouse', 70, 50, 0), tier: 5 }] };
    expect(fixtureLimitOf(packhouse.buildings[0]!, 'packhouseExitCrate')).toBeUndefined();
  });
});

describe('repairing everything in a Bakery interior', () => {
  const worn = (urbs = 100_000): GameState => {
    const state = apply(city(), place('bakeryOven', 2, 3), place('bakeryCounter', 1, 5), place('bakeryMotor', 6, 5));
    const wear = (fixture: { id: number }) => ({ ...fixture, condition: 40 });
    return { ...state, urbs, buildings: state.buildings.map(building => (building.id === 1 ? { ...building, interior: { ...building.interior!, fixtures: building.interior!.fixtures.map(wear) } } : building)) } as GameState;
  };
  const repair: Command = { type: 'RepairAllInteriorFixtures', buildingId: 1 };

  it('restores every worn Fixture and takes the cost of all of them', () => {
    const state = worn();
    const repaired = send(state, repair);
    expect(bakery(repaired).interior!.fixtures.every(fixture => (fixture.condition ?? 100) === 100)).toBe(true);
    expect(repaired.urbs).toBeLessThan(state.urbs);
  });

  it('repairs as many as the Urbs allow, in the order they were placed', () => {
    const state = worn(100_000);
    const first = bakery(state).interior!.fixtures[0]!;
    const partial = send({ ...state, urbs: repairCost(first) }, repair);
    const [done, ...rest] = bakery(partial).interior!.fixtures;
    expect(done!.condition ?? 100).toBe(100);
    expect(rest.every(fixture => (fixture.condition ?? 100) < 100)).toBe(true);
    expect(failure({ ...state, urbs: 0 }, repair)).toBe('error.notEnoughUrbs');
  });

  it('says there is nothing to repair when nothing is worn', () => {
    expect(failure(send(worn(), repair), repair)).toBe('error.nothingToRepair');
  });
});
