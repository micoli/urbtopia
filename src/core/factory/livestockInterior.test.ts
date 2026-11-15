import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fixtureLimitOf, focusGoodsOf, interiorBonusOfBuilding, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { producibleItems, recipeOf } from '../economy/items';
import { checkGameState } from '../../persistence/validate';
import { interiorLinksOf, lineFaultOf } from './factoryInterior';

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
// A Feed intake driven by a Motor, a Conveyor down to a Feeder, a Pen and a Packer driven by a Motor, a Conveyor and a Collection exit.
const chain = [place('livestockFeedIntake', 4, 0), place('livestockShaft', 5, 0, 1), place('livestockMotor', 6, 0, 1), place('livestockConveyor', 4, 1), place('livestockFeeder', 4, 2, 2), place('livestockPen', 4, 3),
  place('livestockPacker', 4, 4), place('livestockShaft', 5, 4, 1), place('livestockMotor', 6, 4, 1), place('livestockConveyor', 4, 5), place('livestockCollectionExit', 4, 6, 2)];
// The same chain without its Collection exit and its last Conveyor.
const openChain = chain.slice(0, 9);
const penOf = (state: GameState): number => idOf(state, 'livestockPen');

describe('the Pens of a Livestock farm interior', () => {
  const fitted = apply(city(), ...chain);
  const pen = penOf(fitted);

  it('offers what the farm gives', () => {
    const goods = focusGoodsOf(farm(fitted), farm(fitted).interior!.fixtures.find(fixture => fixture.id === pen)!);
    expect(goods).toEqual(expect.arrayContaining([...producibleItems('livestockFarm')] as GoodId[]));
  });

  it('takes no herder: the animal is picked on the Pen and the herder stands at the Collection exit', () => {
    expect(failure(fitted, assign(pen))).toBe('error.notAssignable');
    expect(failure(fitted, focus(idOf(fitted, 'livestockCollectionExit'), product))).toBe('error.notAssignable');
  });

  it('is on a Line that reaches the Collection exit once the Feeder, the Packer and the Conveyors are in place', () => {
    const { lined } = interiorLinksOf(farm(fitted).interior!.fixtures);
    expect([pen, idOf(fitted, 'livestockPacker'), idOf(fitted, 'livestockCollectionExit')].every(id => lined.has(id))).toBe(true);
  });

  it('is not on the Line when the Line is cut, or when no Packer carries its production on', () => {
    const cut = apply(fitted, remove(idOf(fitted, 'livestockMotor')));
    expect(interiorLinksOf(farm(cut).interior!.fixtures).lined.has(idOf(cut, 'livestockCollectionExit'))).toBe(false);
    const unpacked = apply(fitted, remove(idOf(fitted, 'livestockPacker')));
    expect(interiorLinksOf(farm(unpacked).interior!.fixtures).lined.has(idOf(unpacked, 'livestockCollectionExit'))).toBe(false);
  });
});

describe('the herder of a Collection exit', () => {
  const fitted = apply(city(), ...chain);
  const exit = idOf(fitted, 'livestockCollectionExit');

  it('works on the animal picked on the Pen upstream, one herder to one exit', () => {
    expect(failure(fitted, assign(exit))).toBe('error.noFocus');
    const assigned = apply(fitted, hire, focus(penOf(fitted), product), assign(exit));
    expect(assignedFixturesOf(farm(assigned).interior, 'herder').map(fixture => fixture.id)).toEqual([exit]);
    expect(failure(assigned, assign(exit))).toBe('error.staffAlreadyAssigned');
    expect(fixtureLimitOf(farm(fitted), 'livestockCollectionExit')!.max).toBe(farm(fitted).slotCount);
  });
});

describe('the fault of a Collection exit that no Line reaches', () => {
  // The exit faces a Motor, which sends no Packets.
  const cut = apply(city(), place('livestockMotor', 2, 4, 1), place('livestockCollectionExit', 3, 4, 1));

  it('names the Fixture next to it as one that sends no Packets, not as a Fixture to turn', () => {
    const exit = farm(cut).interior!.fixtures.find(fixture => fixture.type === 'livestockCollectionExit')!;
    const fault = lineFaultOf(farm(cut).interior!.fixtures, exit);
    expect(fault).toMatchObject({ kind: 'noOutput' });
    expect(fault && 'fixture' in fault && fault.fixture.type).toBe('livestockMotor');
  });
});

describe('the yield of a Livestock farm interior', () => {
  const collected = apply(city(), ...chain);

  it('comes from the Collection exits that the Line reaches, delivered by the herders hired', () => {
    expect(interiorBonusOfBuilding(farm(collected)).yield).toBe(0);
    expect(interiorBonusOfBuilding(farm(apply(collected, hire))).yield).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(farm(apply(city(), ...openChain, hire))).yield).toBe(0);
  });

  it('adds no speed', () => {
    expect(interiorBonusOfBuilding(farm(apply(collected, hire))).speed).toBe(0);
  });
});

describe('the herder of a Livestock farm interior at work on its own', () => {
  const HOUR = 3_600_000;
  const STEP = 60_000;
  const working = (): GameState => {
    const fitted = apply(city(), ...chain);
    const materials: Record<string, number> = {};
    for (const [material, amount] of Object.entries(recipeOf(product))) materials[material] = (materials[material] ?? 0) + amount * 10;
    const state = { ...fitted, adaptationUntil: 100 * HOUR, buildings: [...fitted.buildings, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...fitted.storage, materials: { ...fitted.storage.materials, ...materials } } };
    return apply(state, hire, focus(penOf(state), product), assign(idOf(state, 'livestockCollectionExit')));
  };
  const run = (state: GameState, ms: number): GameState => {
    let current = state;
    for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
    return current;
  };
  const stored = (state: GameState): number => (state.storage.materials as Record<string, number>)[product] ?? (state.storage.goods as Record<string, number>)[product] ?? 0;

  it('collects the production of the Pen at the Collection exit and stores it', () => {
    expect(stored(run(working(), 8 * HOUR))).toBeGreaterThan(0);
  });

  it('waits when the production cannot reach a Collection exit', () => {
    const state = working();
    const without = apply(state, remove(idOf(state, 'livestockPacker')));
    const later = run(without, 8 * HOUR);
    expect(stored(later)).toBe(0);
    expect(farm(later).queue).toHaveLength(0);
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
