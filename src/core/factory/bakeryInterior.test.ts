import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorBonusOfBuilding, interiorLinksOf, interiorSizeOf, newGame, saleIntervalOf, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';

// A city with enough Citizens for every interior to be fitted out.
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'bakery-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [...homes, { ...createBuilding(1, 'bakery', 55, 50, 0), tier }],
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

describe('the Line of a Bakery', () => {
  const withLine = apply(city(), mixer, ...drive, ...gas, ...line);
  const hired = apply(withLine, hire('baker'), hire('seller'));

  it('is linked when it is unbroken from the Mixer to the Counter', () => {
    const { fixtures } = bakery(withLine).interior!;
    const counter = fixtures.find(fixture => fixture.type === 'bakeryCounter')!;
    expect(interiorLinksOf(fixtures).lined.has(counter.id)).toBe(true);
  });

  it('adds nothing until its Staff is hired, then speed with the baker and sales with the seller', () => {
    expect(interiorBonusOfBuilding(bakery(withLine))).toMatchObject({ speed: 0, sales: 0 });
    const bonus = interiorBonusOfBuilding(bakery(apply(withLine, hire('baker'))));
    expect(bonus.speed).toBeGreaterThan(0);
    expect(bonus.sales).toBe(0);
    const both = interiorBonusOfBuilding(bakery(hired));
    expect(both.sales).toBeGreaterThan(0);
  });

  it('sells faster over the Counter once the seller is hired, and as before without', () => {
    const base = saleIntervalOf({ type: 'bakery', tier: 3 });
    expect(saleIntervalOf(bakery(withLine))).toBe(base);
    expect(saleIntervalOf(bakery(hired))).toBeLessThan(base);
  });

  it('adds nothing when the Line is cut', () => {
    const cut = { ...withLine, buildings: withLine.buildings.map(building => (building.id !== 1 ? building : { ...building, interior: { ...building.interior!, fixtures: building.interior!.fixtures.filter(fixture => fixture.type !== 'bakeryConveyor') } })) };
    expect(interiorBonusOfBuilding(bakery(apply(cut, hire('baker'), hire('seller'))))).toMatchObject({ speed: 0, sales: 0 });
  });
});
