import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fixtureLimitOf, focusGoodsOf, freeStaffOf, interiorBonusOfBuilding, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';
import { interiorLinksOf, lineFaultOf, linePathsOf } from './factoryInterior';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'knitwear-interior', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'knitwearFactory', 55, 50, 0), tier: 5 }],
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
const factory = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const hire = (role: 'knitter' | 'seller'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const focus = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
const idOf = (state: GameState, type: FixtureId): number => factory(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const fixtureOf = (state: GameState, id: number) => factory(state).interior!.fixtures.find(fixture => fixture.id === id)!;

// A Knitter and a Finisher, each driven by a Motor through a Shaft, a Conveyor between them and a Display counter at the end of the Line.
const line = [place('knitwearKnitter', 4, 0), place('knitwearShaft', 5, 0, 1), place('knitwearMotor', 6, 0, 1), place('knitwearConveyor', 4, 1), place('knitwearFinisher', 4, 2),
  place('knitwearShaft', 5, 2, 1), place('knitwearMotor', 6, 2, 1), place('knitwearConveyor', 4, 3), place('knitwearCounter', 4, 4, 2)];

describe('the Line of a Knitwear factory interior', () => {
  const fitted = apply(city(), ...line);
  const knitter = idOf(fitted, 'knitwearKnitter');
  const counter = idOf(fitted, 'knitwearCounter');

  it('offers a Knitter what the factory makes, and a Display counter only what the Knitters upstream make', () => {
    expect(focusGoodsOf(factory(fitted), fixtureOf(fitted, knitter))).toEqual(expect.arrayContaining(['sweater', 'gloves']));
    expect(focusGoodsOf(factory(fitted), fixtureOf(fitted, counter))).toEqual([]);
    const knitting = apply(fitted, focus(knitter, 'sweater'));
    expect(focusGoodsOf(factory(knitting), fixtureOf(knitting, counter))).toEqual(['sweater']);
  });

  it('is complete from the Knitter to the Display counter once both Machines have their Drive', () => {
    const lined = interiorLinksOf(factory(fitted).interior!.fixtures).lined;
    expect(lined.has(counter)).toBe(true);
    const cut = apply(fitted, { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: idOf(fitted, 'knitwearMotor') });
    expect(interiorLinksOf(factory(cut).interior!.fixtures).lined.has(counter)).toBe(false);
  });

  it('is only complete through a Finisher: without one the Knitter and the Display counter are left out', () => {
    const bare = apply(city(), place('knitwearKnitter', 4, 0), place('knitwearShaft', 5, 0, 1), place('knitwearMotor', 6, 0, 1), place('knitwearConveyor', 4, 1), place('knitwearConveyor', 4, 2), place('knitwearCounter', 4, 3, 2));
    const { lined } = interiorLinksOf(factory(bare).interior!.fixtures);
    expect(lined.size).toBe(0);
    const counterOf = idOf(bare, 'knitwearCounter');
    const fault = lineFaultOf(factory(bare).interior!.fixtures, fixtureOf(bare, counterOf));
    expect(fault).toMatchObject({ kind: 'missingStage' });
    expect(interiorLinksOf(factory(fitted).interior!.fixtures).lined.has(counter)).toBe(true);
  });

  it('offers the Finisher from the first Tier, so that the Line can run there', () => {
    const first = { ...city(), buildings: city().buildings.map(candidate => (candidate.id === 1 ? { ...candidate, tier: 1 } : candidate)) };
    expect(failure(first, place('knitwearFinisher', 4, 2))).toBeNull();
  });

  it('takes a knitter on a Knitter, one to one, as many as there are production Slots', () => {
    const hired = apply(fitted, hire('knitter'), focus(knitter, 'sweater'));
    expect(failure(fitted, assign(knitter))).toBe('error.noFocus');
    const assigned = apply(hired, assign(knitter));
    expect(assignedFixturesOf(factory(assigned).interior, 'knitter').map(fixture => fixture.id)).toEqual([knitter]);
    expect(freeStaffOf(factory(assigned), 'knitter')).toBe(0);
    expect(fixtureLimitOf(factory(fitted), 'knitwearKnitter')!.max).toBe(factory(fitted).slotCount);
  });

  it('adds the speed of its Machines only to the Recipe of the Knitter that has a knitter', () => {
    const working = apply(fitted, hire('knitter'), focus(knitter, 'sweater'), assign(knitter));
    expect(interiorBonusOfBuilding(factory(working), 'sweater').speed).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(factory(working), 'gloves').speed).toBe(0);
    expect(interiorBonusOfBuilding(factory(fitted), 'sweater').speed).toBe(0);
  });
});

describe('the pieces that ride the Line of a Knitwear factory interior', () => {
  // Two Knitters, one knitting sweaters and one gloves, whose Conveyors join before the Finisher and the Display counter.
  const joined = apply(city(), place('knitwearMotor', 1, 0, 1), place('knitwearKnitter', 0, 0), place('knitwearCounter', 0, 3, 2), place('knitwearFinisher', 0, 2), place('knitwearMotor', 1, 2, 1),
    place('knitwearKnitter', 4, 0), place('knitwearConveyorElbowRight', 4, 1), place('knitwearConveyor', 3, 1, 1), place('knitwearConveyor', 2, 1, 1), place('knitwearConveyor', 1, 1, 1),
    place('knitwearConveyorJoinStraightRight', 0, 1), place('knitwearMotor', 5, 0, 1));

  it('show what each Knitter knits when the Display counter has no Sold Good yet', () => {
    const knitters = factory(joined).interior!.fixtures.filter(fixture => fixture.type === 'knitwearKnitter').sort((a, b) => a.id - b.id);
    const picked = apply(joined, focus(knitters[0]!.id, 'sweater'), focus(knitters[1]!.id, 'gloves'));
    const paths = linePathsOf(factory(picked).interior!.fixtures);
    const goodOf = (source: number) => paths.find(path => path.source === source)?.baked?.good;
    expect(goodOf(knitters[0]!.id)).toBe('sweater');
    expect(goodOf(knitters[1]!.id)).toBe('gloves');
  });
});

describe('the pieces after a splitting Conveyor', () => {
  // The two Knitters of the joined Line, then a split after the Finisher: straight on to a Display counter that sells sweaters, and to the right to one that sells gloves.
  const split = apply(city(), place('knitwearMotor', 1, 0, 1), place('knitwearKnitter', 0, 0), place('knitwearFinisher', 0, 2), place('knitwearMotor', 1, 2, 1), place('knitwearKnitter', 4, 0),
    place('knitwearConveyorElbowRight', 4, 1), place('knitwearConveyor', 3, 1, 1), place('knitwearConveyor', 2, 1, 1), place('knitwearConveyor', 1, 1, 1), place('knitwearConveyorJoinStraightRight', 0, 1),
    place('knitwearMotor', 5, 0, 1), place('knitwearConveyorSplitStraightRight', 0, 3), place('knitwearConveyorElbowRight', 1, 3, 3), place('knitwearCounter', 0, 4, 2), place('knitwearCounter', 1, 4, 2));

  it('only ride on to the Display counter that sells them', () => {
    const fixtures = factory(split).interior!.fixtures;
    const knitters = fixtures.filter(fixture => fixture.type === 'knitwearKnitter').sort((a, b) => a.id - b.id);
    const counters = fixtures.filter(fixture => fixture.type === 'knitwearCounter').sort((a, b) => a.x - b.x);
    const picked = apply(split, focus(knitters[0]!.id, 'sweater'), focus(knitters[1]!.id, 'gloves'), focus(counters[0]!.id, 'sweater'), focus(counters[1]!.id, 'gloves'));
    const paths = linePathsOf(factory(picked).interior!.fixtures);
    expect(paths.map(path => path.baked?.good).sort()).toEqual(['gloves', 'sweater']);
    const endOf = (good: string) => paths.find(path => path.baked?.good === good)!.points.at(-1)!.x;
    expect(endOf('sweater')).toBeLessThan(1);
    expect(endOf('gloves')).toBeGreaterThan(1);
  });
});

describe('the knitter of a Knitwear factory interior at work on its own', () => {
  const HOUR = 3_600_000;
  const STEP = 60_000;
  const working = (): GameState => {
    const fitted = apply(city(), ...line);
    const materials: Record<string, number> = {};
    for (const [material, amount] of Object.entries(recipeOf('sweater'))) materials[material] = (materials[material] ?? 0) + amount * 10;
    const state = { ...fitted, adaptationUntil: 100 * HOUR, buildings: [...fitted.buildings, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...fitted.storage, materials: { ...fitted.storage.materials, ...materials } } };
    const knitter = idOf(state, 'knitwearKnitter');
    return apply(state, hire('knitter'), focus(knitter, 'sweater'), assign(knitter));
  };
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };

  it('knits on its own and stores the sweaters', () => {
    const later = run(working(), 8 * HOUR);
    expect((later.storage.goods as Record<string, number>).sweater ?? 0).toBeGreaterThan(0);
  });

  it('waits when the Line is cut', () => {
    const state = working();
    const cut = apply(state, { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: idOf(state, 'knitwearMotor') });
    expect(factory(run(cut, HOUR)).queue).toHaveLength(0);
  });

  it('stays valid as a save while the knitter is at work', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(run(working(), 5 * STEP)))).ok).toBe(true);
  });
});
