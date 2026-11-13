import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, focusGoodsOf, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'dairy-assignments', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'dairy', 55, 50, 0), tier: 5 }],
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
const dairy = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const hire = (role: 'cheesemaker' | 'creamMaker' | 'seller'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const focus = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
const idOf = (state: GameState, type: FixtureId): number => dairy(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const fixtureOf = (state: GameState, id: number) => dairy(state).interior!.fixtures.find(fixture => fixture.id === id)!;

const pumped = (x: number, y: number, rotation: 1 | 3): Command[] => (rotation === 1
  ? [place('dairyTank', x + 1, y, 1), place('dairyPump', x, y, 1), place('dairyMotor', x, y + 1, 2)]
  : [place('dairyTank', x - 1, y, 3), place('dairyPump', x, y, 3), place('dairyMotor', x, y - 1, 0)]);
const line = [place('dairyMilkVat', 4, 0), place('dairyConveyor', 4, 1), place('dairyPasteurizer', 4, 2), place('dairyConveyor', 4, 3), place('dairyCheeseCellar', 4, 4), place('dairyConveyor', 4, 5),
  place('dairyConveyor', 4, 6), place('dairyCounter', 4, 7, 2)];
const flows = [...pumped(5, 0, 1), ...pumped(3, 2, 3), ...pumped(3, 4, 3)];

describe('the Staff assigned in a Dairy interior', () => {
  const fitted = apply(city(), ...flows, ...line);
  const [pasteurizer, cellar, counter] = [idOf(fitted, 'dairyPasteurizer'), idOf(fitted, 'dairyCheeseCellar'), idOf(fitted, 'dairyCounter')];

  it('offers a Pasteuriser the cream and a Cheese cellar the cheeses, and a Display counter what is made upstream of it', () => {
    expect(focusGoodsOf(dairy(fitted), fixtureOf(fitted, pasteurizer))).toEqual(['cream']);
    expect(focusGoodsOf(dairy(fitted), fixtureOf(fitted, cellar))).toEqual(expect.arrayContaining(['cheese']));
    expect(focusGoodsOf(dairy(fitted), fixtureOf(fitted, cellar))).not.toContain('cream');
    expect(focusGoodsOf(dairy(fitted), fixtureOf(fitted, counter))).toEqual([]);
    const making = apply(fitted, focus(pasteurizer, 'cream'), focus(cellar, 'cheese'));
    expect(focusGoodsOf(dairy(making), fixtureOf(making, counter))).toEqual(expect.arrayContaining(['cream', 'cheese']));
  });

  it('refuses a Good the Machine does not make', () => {
    expect(failure(fitted, focus(pasteurizer, 'cheese'))).toBe('error.cannotProduce');
    expect(failure(fitted, focus(cellar, 'cream'))).toBe('error.cannotProduce');
  });

  it('assigns a cheesemaker to a Cheese cellar and a cream maker to a Pasteuriser, not the other way round', () => {
    const making = apply(fitted, hire('creamMaker'), focus(pasteurizer, 'cream'), focus(cellar, 'cheese'));
    expect(failure(making, assign(cellar))).toBe('error.noFreeStaff');
    const assigned = apply(making, assign(pasteurizer));
    expect(assignedFixturesOf(dairy(assigned).interior, 'creamMaker').map(fixture => fixture.id)).toEqual([pasteurizer]);
  });

  it('hires sellers up to the Counter Slots', () => {
    const hired = apply(fitted, hire('seller'));
    expect(dairy(hired).interior!.staff?.seller).toBe(1);
  });
});

describe('the Staff assigned in a Dairy interior at work on its own', () => {
  const HOUR = 3_600_000;
  const stocked = (): GameState => {
    const state = apply(city(), ...flows, ...line);
    const materials: Record<string, number> = {};
    for (const good of ['cream', 'cheese'] as const) for (const [material, amount] of Object.entries(recipeOf(good))) materials[material] = (materials[material] ?? 0) + amount * 100;
    return { ...state, adaptationUntil: 100 * HOUR, buildings: [...state.buildings, createBuilding(2, 'storehouse', 70, 50, 0)], storage: { ...state.storage, materials: { ...state.storage.materials, ...materials } } };
  };
  const working = (): GameState => {
    const state = stocked();
    const [pasteurizer, cellar, counter] = [idOf(state, 'dairyPasteurizer'), idOf(state, 'dairyCheeseCellar'), idOf(state, 'dairyCounter')];
    return apply(state, hire('creamMaker'), hire('cheesemaker'), hire('seller'), focus(pasteurizer, 'cream'), focus(cellar, 'cheese'), focus(counter, 'cream'), assign(pasteurizer), assign(cellar), assign(counter));
  };
  const STEP = 60_000;
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };

  it('does nothing on its own without Staff assigned', () => {
    const idle = run(stocked(), HOUR);
    expect(dairy(idle).queue).toHaveLength(0);
  });

  it('makes cream and cheese on its own and stores them', () => {
    const later = run(working(), 6 * HOUR);
    expect(later.storage.goods.cheese ?? 0).toBeGreaterThan(0);
    const sold = dairy(later).stacks.reduce((total, stack) => total + (stack.good === 'cream' ? stack.stock : 0), 0);
    expect((later.storage.goods.cream ?? 0) + sold).toBeGreaterThan(0);
  });

  it('stays valid as a save while the Staff is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working(), 5 * STEP)))).ok).toBe(true);
  });
});
