import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorBonusOfBuilding, interiorLinksOf, interiorSizeOf, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { maxQuantityOf } from '../economy/production';

// A city with enough Citizens for every interior to be fitted out.
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'dairy-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [...homes, { ...createBuilding(1, 'dairy', 55, 50, 0), tier }],
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
const dairy = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const hire = (role: 'cheesemaker' | 'creamMaker'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });

// A Milk vat against the back wall at (4, 0) takes its milk on the right, a Pasteuriser at (4, 2) and a Cheese cellar at (4, 4) on the left: each has a Tank, a Pump and the Motor that drives it.
const pumped = (x: number, y: number, rotation: 1 | 3): Command[] => (rotation === 1
  ? [place('dairyTank', x + 1, y, 1), place('dairyPump', x, y, 1), place('dairyMotor', x, y + 1, 2)]
  : [place('dairyTank', x - 1, y, 3), place('dairyPump', x, y, 3), place('dairyMotor', x, y - 1, 0)]);
const line = [place('dairyMilkVat', 4, 0), place('dairyConveyor', 4, 1), place('dairyPasteurizer', 4, 2), place('dairyConveyor', 4, 3), place('dairyCheeseCellar', 4, 4), place('dairyConveyor', 4, 5),
  place('dairyConveyor', 4, 6), place('dairyCounter', 4, 7, 2)];
const flows = [...pumped(5, 0, 1), ...pumped(3, 2, 3), ...pumped(3, 4, 3)];

describe('the Dairy interior', () => {
  const withLine = apply(city(), ...flows, ...line);

  it('is a Line interior of its own kind, with a room that grows with the Tier', () => {
    expect(interiorSizeOf(dairy(city(1)))).toBe(6);
    expect(interiorSizeOf(dairy(city(5)))).toBe(10);
    expect(failure(city(), place('bakeryOven', 2, 2))).toBe('error.unknownCommand');
  });

  it('links its Line from the vat to the Counter once the milk reaches every Machine', () => {
    const { fixtures } = dairy(withLine).interior!;
    const lined = interiorLinksOf(fixtures).lined;
    for (const type of ['dairyMilkVat', 'dairyPasteurizer', 'dairyCheeseCellar', 'dairyCounter']) expect(lined.has(fixtures.find(fixture => fixture.type === type)!.id)).toBe(true);
  });

  it('delivers the Cheese yield with the cheesemaker and the Cream yield with the cream maker', () => {
    expect(interiorBonusOfBuilding(dairy(withLine), 'cheese').yield).toBe(0);
    expect(interiorBonusOfBuilding(dairy(withLine), 'cream').yield).toBe(0);
    const cheese = apply(withLine, hire('cheesemaker'));
    expect(interiorBonusOfBuilding(dairy(cheese), 'cheese').yield).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(dairy(cheese), 'goatCheese').yield).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(dairy(cheese), 'cream').yield).toBe(0);
    const both = apply(cheese, hire('creamMaker'));
    expect(interiorBonusOfBuilding(dairy(both), 'cream').yield).toBeGreaterThan(0);
  });

  it('lets a cycle bring more units only when a role is hired', () => {
    expect(maxQuantityOf(dairy(withLine))).toBe(maxQuantityOf({ ...dairy(withLine), interior: undefined }));
    expect(maxQuantityOf(dairy(apply(withLine, hire('cheesemaker'))))).toBeGreaterThanOrEqual(maxQuantityOf({ ...dairy(withLine), interior: undefined }));
  });

  it('adds nothing when the Line is cut', () => {
    const cut = { ...withLine, buildings: withLine.buildings.map(building => (building.id !== 1 ? building : { ...building, interior: { ...building.interior!, fixtures: building.interior!.fixtures.filter(fixture => fixture.type !== 'dairyConveyor') } })) };
    expect(interiorBonusOfBuilding(dairy(apply(cut, hire('cheesemaker'), hire('creamMaker'))), 'cheese').yield).toBe(0);
  });
});
