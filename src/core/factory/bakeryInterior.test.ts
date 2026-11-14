import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorBonusOfBuilding, interiorLinksOf, linePathsOf, interiorPowerOfBuilding, interiorSizeOf, newGame, saleIntervalOf, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';

// A city with enough Citizens for every interior to be fitted out.
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

// Room for the Ovens and the Display counters of every test: more Slots than a Bakery starts with.
const bakeryOf = (tier: number): Building => {
  const bakery = createBuilding(1, 'bakery', 55, 50, 0);
  return { ...bakery, tier, slotCount: 5, stacks: [...bakery.stacks, bakery.stacks[0]!] };
};

const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'bakery-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [...homes, bakeryOf(tier)],
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
const bakery = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const hire = (role: 'baker' | 'seller'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const idOf = (state: GameState, type: FixtureId, nth = 0): number => bakery(state).interior!.fixtures.filter(fixture => fixture.type === type)[nth]!.id;
const focus = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });

// A Motor and a Shaft bring the Drive to the right of a Mixer against the back wall at (4, 0); its Line runs toward the front through an Oven, whose gas comes from a Tank and a Pump
// that a Motor drives, to a Counter on the front edge of the room.
const mixer = place('bakeryMixer', 4, 0);
const drive = [place('bakeryShaft', 5, 0, 1), place('bakeryMotor', 6, 0, 1)];
const gas = [place('bakeryTank', 2, 2, 3), place('bakeryPump', 3, 2, 3), place('bakeryMotor', 3, 1, 0)];
const line = [place('bakeryConveyor', 4, 1), place('bakeryOven', 4, 2), place('bakeryConveyor', 4, 3), place('bakeryConveyor', 4, 4), place('bakeryConveyor', 4, 5), place('bakeryConveyor', 4, 6), place('bakeryCounter', 4, 7, 2)];

describe('the Bakery interior', () => {
  it('is a Line interior of its own kind, with a room that grows with the Tier', () => {
    expect(interiorSizeOf(bakery(city(1)))).toBe(6);
    expect(interiorSizeOf(bakery(city(5)))).toBe(10);
  });

  it('takes the Fixtures of the Bakery and no others', () => {
    expect(failure(city(), place('millstone', 2, 2))).toBe('error.unknownCommand');
    expect(bakery(apply(city(), place('bakeryMotor', 2, 2))).interior?.fixtures).toHaveLength(1);
  });

  it('lets a Mixer stand against the back wall only', () => {
    expect(failure(city(), place('bakeryMixer', 3, 2))).toBe('error.tilesOccupied');
    expect(bakery(apply(city(), mixer)).interior?.fixtures).toHaveLength(1);
  });
});

describe('the Counter of a Bakery', () => {
  it('stands anywhere in the room, in any turn', () => {
    expect(failure(city(), place('bakeryCounter', 3, 3, 0))).toBeNull();
    expect(failure(city(), place('bakeryCounter', 2, 2, 3))).toBeNull();
  });
});

describe('the Counters of a Bakery as the base of its yield and its power', () => {
  const counters = [place('bakeryCounter', 1, 4, 0), place('bakeryCounter', 2, 4, 0)];
  const base = apply(city(5), mixer, ...drive, ...gas, ...line);
  const branching = [place('bakeryConveyor', 4, 1), place('bakeryOven', 4, 2), place('bakeryCounter', 3, 3, 3), place('bakeryCounter', 5, 4, 1), place('bakeryCounter', 3, 5, 3),
    place('bakeryConveyorSplitStraightLeft', 4, 3), place('bakeryConveyorSplitStraightRight', 4, 4), place('bakeryConveyorSplitStraightLeft', 4, 5), place('bakeryConveyor', 4, 6)];
  const staffedCounters = (state: GameState, count: number): GameState => {
    const ids = bakery(state).interior!.fixtures.filter(fixture => fixture.type === 'bakeryCounter').slice(0, count).map(fixture => fixture.id);
    return apply(state, focus(idOf(state, 'bakeryOven'), 'bread'), ...ids.map(() => hire('seller')), ...ids.map(id => focus(id, 'bread')), ...ids.map(assign));
  };

  it('adds yield with each Counter that a seller is assigned to', () => {
    const three = apply(city(5), mixer, ...drive, ...gas, ...branching);
    const yieldOf = (state: GameState) => interiorBonusOfBuilding(bakery(state), 'bread').yield;
    expect(yieldOf(staffedCounters(three, 1))).toBeGreaterThan(0);
    expect(yieldOf(staffedCounters(three, 3))).toBeGreaterThan(yieldOf(staffedCounters(three, 1)));
  });
  it('is delivered by the sellers: a Counter with no seller adds no yield', () => {
    const three = apply(city(5), mixer, ...drive, ...gas, ...branching);
    expect(interiorBonusOfBuilding(bakery(three), 'bread').yield).toBe(0);
  });
  it('draws electricity for each Counter placed, reached or not', () => {
    const before = interiorPowerOfBuilding(bakery(base));
    const after = interiorPowerOfBuilding(bakery(apply(base, ...counters)));
    expect(after - before).toBeCloseTo(0.6);
  });
});

describe('what an Oven feeds', () => {
  // Past the Oven, Splitters lead to four Counters; the Oven feeds the first three placed.
  const counters = [place('bakeryCounter', 3, 3, 3), place('bakeryCounter', 5, 4, 1), place('bakeryCounter', 3, 5, 3), place('bakeryCounter', 4, 7, 2)];
  const splits = [place('bakeryConveyorSplitStraightLeft', 4, 3), place('bakeryConveyorSplitStraightRight', 4, 4), place('bakeryConveyorSplitStraightLeft', 4, 5), place('bakeryConveyor', 4, 6)];
  const state = apply(city(), mixer, ...drive, ...gas, place('bakeryConveyor', 4, 1), place('bakeryOven', 4, 2), ...counters, ...splits);
  const { fixtures } = bakery(state).interior!;
  const counterIds = fixtures.filter(fixture => fixture.type === 'bakeryCounter').map(fixture => fixture.id);

  it('leaves the Counters past the third without Packets', () => {
    const { lined } = interiorLinksOf(fixtures);
    expect(counterIds.filter(id => lined.has(id))).toEqual(counterIds.slice(0, 3));
  });
});

describe('the Line of a Bakery', () => {
  const withLine = apply(city(), mixer, ...drive, ...gas, ...line);
  const oven = idOf(withLine, 'bakeryOven');
  const counter = idOf(withLine, 'bakeryCounter');
  const staffed = apply(withLine, hire('baker'), hire('seller'), focus(oven, 'bread'), focus(counter, 'bread'), assign(oven), assign(counter));

  it('is linked when it is unbroken from the Mixer to the Counter', () => {
    const { fixtures } = bakery(withLine).interior!;
    expect(interiorLinksOf(fixtures).lined.has(counter)).toBe(true);
  });

  it('adds nothing until its Staff is assigned, then speed for the Recipe and sales for the Sold Good only', () => {
    expect(interiorBonusOfBuilding(bakery(withLine), 'bread')).toMatchObject({ speed: 0, sales: 0 });
    expect(interiorBonusOfBuilding(bakery(apply(withLine, hire('baker'), hire('seller'), focus(oven, 'bread'), focus(counter, 'bread'))), 'bread')).toMatchObject({ speed: 0, sales: 0 });
    const bonus = interiorBonusOfBuilding(bakery(staffed), 'bread');
    expect(bonus.speed).toBeGreaterThan(0);
    expect(bonus.sales).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(bakery(staffed), 'fougasse')).toMatchObject({ speed: 0, sales: 0 });
  });

  it('sells faster over the Counter for the Sold Good of an assigned seller, and as before for another Good', () => {
    const base = saleIntervalOf({ type: 'bakery', tier: 3 });
    expect(saleIntervalOf(bakery(withLine), 'bread')).toBe(base);
    expect(saleIntervalOf(bakery(staffed), 'bread')).toBeLessThan(base);
    expect(saleIntervalOf(bakery(staffed), 'fougasse')).toBe(base);
  });

  it('carries the Packets to the shelf of the case, not through the glass', () => {
    const paths = linePathsOf(bakery(withLine).interior!.fixtures);
    const end = paths[0]!.points.at(-1)!;
    expect(end.x).toBeCloseTo(4.5);
    expect(end.y).toBeCloseTo(7.5 + 0.3);
  });

  it('carries dough in packets to the Oven, then the Good that arrives at the Counter', () => {
    const fixtures = (state: GameState) => bakery(state).interior!.fixtures;
    expect(linePathsOf(fixtures(withLine))[0]!.baked).toBeUndefined();
    const baking = apply(withLine, focus(oven, 'bread'));
    const path = linePathsOf(fixtures(baking))[0]!;
    expect(path.baked).toEqual({ from: expect.any(Number), good: 'bread' });
    expect(path.points[path.baked!.from]).toEqual({ x: 4.5, y: 2.5 });
    const selling = apply(baking, focus(counter, 'bread'));
    expect(linePathsOf(fixtures(selling))[0]!.baked?.good).toBe('bread');
  });

  it('adds nothing when the Line is cut', () => {
    const cut = { ...staffed, buildings: staffed.buildings.map(building => (building.id !== 1 ? building : { ...building, interior: { ...building.interior!, fixtures: building.interior!.fixtures.filter(fixture => fixture.type !== 'bakeryConveyor') } })) };
    expect(interiorBonusOfBuilding(bakery(cut), 'bread')).toMatchObject({ speed: 0, sales: 0 });
  });
});
