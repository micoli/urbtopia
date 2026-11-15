import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fixtureLimitOf, focusGoodsOf, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { producibleItems, recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';
import { interiorBonusOfBuilding, interiorLinksOf } from './factoryInterior';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (tier = 3): GameState => ({
  ...newGame({ seed: 'textile-interior', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'textileMill', 55, 50, 0), tier }],
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
const hire: Command = { type: 'HireInteriorStaff', buildingId: 1, role: 'spinner' };
const idOf = (state: GameState, type: FixtureId): number => mill(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const fabric = producibleItems('textileMill')[0] as GoodId;

// A Motor and a Shaft drive the Spinner from the front: nothing else is needed.
const schema = [place('textileMotor', 2, 2), place('textileShaft', 2, 3), place('textileSpinner', 2, 4, 2)];

describe('the Spinner of a Textile mill interior', () => {
  const fitted = apply(city(), ...schema);
  const spinner = idOf(fitted, 'textileSpinner');

  it('offers what the Textile mill makes', () => {
    const goods = focusGoodsOf(mill(fitted), mill(fitted).interior!.fixtures.find(fixture => fixture.id === spinner)!);
    expect(goods).toEqual(expect.arrayContaining([...producibleItems('textileMill')] as GoodId[]));
    expect(goods.length).toBeGreaterThan(1);
  });

  it('is at work once it has its Drive and a Recipe, with no Pipe or Line', () => {
    expect(interiorLinksOf(mill(fitted).interior!.fixtures).lined.has(spinner)).toBe(false);
    const spinning = apply(fitted, focus(spinner, fabric));
    expect(interiorLinksOf(mill(spinning).interior!.fixtures).lined.has(spinner)).toBe(true);
  });

  it('stops when the Motor is removed', () => {
    const spinning = apply(fitted, focus(spinner, fabric), remove(idOf(fitted, 'textileMotor')));
    expect(interiorLinksOf(mill(spinning).interior!.fixtures).lined.has(spinner)).toBe(false);
  });

  it('takes a spinner, one to one', () => {
    const hired = apply(fitted, hire);
    expect(failure(hired, assign(spinner))).toBe('error.noFocus');
    const assigned = apply(hired, focus(spinner, fabric), assign(spinner));
    expect(assignedFixturesOf(mill(assigned).interior, 'spinner').map(fixture => fixture.id)).toEqual([spinner]);
    expect(failure(assigned, assign(spinner))).toBe('error.staffAlreadyAssigned');
  });

  it('adds speed that the spinners hired deliver, and no yield', () => {
    const hired = apply(fitted, hire);
    const bonus = interiorBonusOfBuilding(mill(hired));
    expect(bonus.speed).toBeGreaterThan(0);
    expect(bonus.yield).toBe(0);
    expect(interiorBonusOfBuilding(mill(fitted)).speed).toBe(0);
  });
});

describe('the spinner of a Textile mill interior at work on its own', () => {
  const HOUR = 3_600_000;
  const STEP = 60_000;
  const stocked = (): GameState => {
    const state = apply(city(), ...schema);
    const materials: Record<string, number> = {};
    for (const [material, amount] of Object.entries(recipeOf(fabric))) materials[material] = (materials[material] ?? 0) + amount * 10;
    return { ...state, adaptationUntil: 100 * HOUR, buildings: [...state.buildings, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...state.storage, materials: { ...state.storage.materials, ...materials } } };
  };
  const working = (): GameState => {
    const state = stocked();
    const spinner = idOf(state, 'textileSpinner');
    return apply(state, hire, focus(spinner, fabric), assign(spinner));
  };
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };
  const stored = (state: GameState): number => (state.storage.materials as Record<string, number>)[fabric] ?? (state.storage.goods as Record<string, number>)[fabric] ?? 0;

  it('does nothing on its own without a spinner assigned', () => {
    const state = stocked();
    const idle = run(apply(state, focus(idOf(state, 'textileSpinner'), fabric)), HOUR);
    expect(mill(idle).queue).toHaveLength(0);
  });

  it('spins on its own and stores the textile', () => {
    expect(stored(run(working(), 6 * HOUR))).toBeGreaterThan(0);
  });

  it('waits when the Motor is missing', () => {
    const state = working();
    const broken = apply(state, remove(idOf(state, 'textileMotor')));
    expect(mill(run(broken, HOUR)).queue).toHaveLength(0);
  });

  it('stays valid as a save while the spinner is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working(), 5 * STEP)))).ok).toBe(true);
  });
});

describe('the Spinners a Textile mill interior takes', () => {
  const limit = (tier: number) => fixtureLimitOf({ ...mill(city(tier)), slotCount: 3 }, 'textileSpinner')!.max;

  it('follow the production Slots', () => {
    expect([1, 3, 5].map(limit)).toEqual([3, 3, 3]);
  });
});
