import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fixtureLimitOf, focusGoodsOf, interiorBonusOfBuilding, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { producibleItems, recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';
import { interiorLinksOf } from './factoryInterior';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'livestock-interior', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'livestockFarm', 55, 50, 0), tier: 5 }],
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
const farm = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const remove = (fixtureId: number): Command => ({ type: 'RemoveInteriorFixture', buildingId: 1, fixtureId });
const hire: Command = { type: 'HireInteriorStaff', buildingId: 1, role: 'herder' };
const focus = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
const idOf = (state: GameState, type: FixtureId): number => farm(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const product = producibleItems('livestockFarm')[0] as GoodId;

// A Feed intake driven by a Motor, a Conveyor down to a Feeder, and a Pen on each side of the Feeder.
const feeding = [place('livestockFeedIntake', 4, 0), place('livestockShaft', 5, 0, 1), place('livestockMotor', 6, 0, 1), place('livestockConveyor', 4, 1), place('livestockConveyor', 4, 2),
  place('livestockConveyor', 4, 3), place('livestockFeeder', 4, 4, 2), place('livestockPen', 3, 4, 2), place('livestockPen', 5, 4, 2)];
// The same Line, ending in a Collection exit.
const collecting = [...feeding.slice(0, 6), place('livestockCollectionExit', 4, 4, 2)];

describe('the Pens of a Livestock farm interior', () => {
  const fitted = apply(city(), ...feeding);
  const pen = farm(fitted).interior!.fixtures.find(fixture => fixture.type === 'livestockPen')!.id;

  it('offers what the farm gives', () => {
    const goods = focusGoodsOf(farm(fitted), farm(fitted).interior!.fixtures.find(fixture => fixture.id === pen)!);
    expect(goods).toEqual(expect.arrayContaining([...producibleItems('livestockFarm')] as GoodId[]));
  });

  it('is fed once it has a Recipe and stands next to a Feeder that the Line reaches', () => {
    expect(interiorLinksOf(farm(fitted).interior!.fixtures).lined.has(pen)).toBe(false);
    const fed = apply(fitted, focus(pen, product));
    expect(interiorLinksOf(farm(fed).interior!.fixtures).lined.has(pen)).toBe(true);
  });

  it('is not fed when the Line is cut or when no Feeder is beside it', () => {
    const cut = apply(fitted, focus(pen, product), remove(idOf(fitted, 'livestockMotor')));
    expect(interiorLinksOf(farm(cut).interior!.fixtures).lined.has(pen)).toBe(false);
    const alone = apply(city(), place('livestockPen', 0, 0), place('livestockFeeder', 4, 4, 2));
    const lonely = apply(alone, focus(idOf(alone, 'livestockPen'), product));
    expect(interiorLinksOf(farm(lonely).interior!.fixtures).lined.has(idOf(lonely, 'livestockPen'))).toBe(false);
  });

  it('takes a herder, one to one, as many as there are production Slots', () => {
    expect(failure(fitted, assign(pen))).toBe('error.noFocus');
    const assigned = apply(fitted, hire, focus(pen, product), assign(pen));
    expect(assignedFixturesOf(farm(assigned).interior, 'herder').map(fixture => fixture.id)).toEqual([pen]);
    expect(failure(assigned, assign(pen))).toBe('error.staffAlreadyAssigned');
    expect(fixtureLimitOf(farm(fitted), 'livestockPen')!.max).toBe(farm(fitted).slotCount);
  });
});

describe('the yield of a Livestock farm interior', () => {
  const collected = apply(city(), ...collecting);

  it('comes from the Collection exits that the Line reaches, delivered by the herders hired', () => {
    expect(interiorBonusOfBuilding(farm(collected)).yield).toBe(0);
    expect(interiorBonusOfBuilding(farm(apply(collected, hire))).yield).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(farm(apply(city(), ...feeding.slice(0, 6), hire))).yield).toBe(0);
  });

  it('adds no speed', () => {
    expect(interiorBonusOfBuilding(farm(apply(collected, hire))).speed).toBe(0);
  });
});

describe('the herder of a Livestock farm interior at work on its own', () => {
  const HOUR = 3_600_000;
  const STEP = 60_000;
  const working = (): GameState => {
    const fitted = apply(city(), ...feeding);
    const materials: Record<string, number> = {};
    for (const [material, amount] of Object.entries(recipeOf(product))) materials[material] = (materials[material] ?? 0) + amount * 10;
    const state = { ...fitted, adaptationUntil: 100 * HOUR, buildings: [...fitted.buildings, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...fitted.storage, materials: { ...fitted.storage.materials, ...materials } } };
    const pen = idOf(state, 'livestockPen');
    return apply(state, hire, focus(pen, product), assign(pen));
  };
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };
  const stored = (state: GameState): number => (state.storage.materials as Record<string, number>)[product] ?? (state.storage.goods as Record<string, number>)[product] ?? 0;

  it('collects the production of a fed Pen and stores it', () => {
    expect(stored(run(working(), 8 * HOUR))).toBeGreaterThan(0);
  });

  it('waits when the Line is cut', () => {
    const state = working();
    const cut = apply(state, remove(idOf(state, 'livestockMotor')));
    expect(farm(run(cut, HOUR)).queue).toHaveLength(0);
  });

  it('stays valid as a save while the herder is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working(), 5 * STEP)))).ok).toBe(true);
  });
});
