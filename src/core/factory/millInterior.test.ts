import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, hasProductionInterior, interiorBonusOfBuilding, interiorKindOf, interiorSizeOf, newGame, productionDurationOf, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { interiorLinksOf } from './factoryInterior';
import { FIXTURES } from '../venues/fixtures';

// A city with enough Citizens for every interior to be fitted out.
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'mill-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [...homes, { ...createBuilding(1, 'mill', 55, 50, 0), tier }, createBuilding(2, 'arcade', 60, 50, 0)],
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
const mill = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);

// A Motor turns a Shaft that brings the Drive to the front of a Millstone; a second Motor drives the Pump, which pushes through the Pipes to a Cleaner, the Millstone, a Bagger and an Oil tank.
export const fitted = [place('millMotor', 2, 2), place('millShaft', 2, 3), place('millstone', 2, 4, 2), place('millMotor', 4, 6, 2), place('millPump', 4, 5, 1), place('millPipeCross', 3, 5), place('millPipeCross', 2, 5),
  place('millPipe', 1, 5, 1), place('millCleaner', 0, 5, 1), place('millBagger', 2, 6), place('millOilTank', 3, 4, 2)];

describe('the Mill interior', () => {
  it('is a Production interior of its own kind, with a room that grows with the Tier', () => {
    expect(hasProductionInterior(mill(city()))).toBe(true);
    expect(interiorKindOf(mill(city()))).toBe('mill');
    expect(interiorSizeOf(mill(city(1)))).toBe(5);
    expect(interiorSizeOf(mill(city(5)))).toBe(9);
  });

  it('takes the Fixtures of the Mill and no others', () => {
    expect(FIXTURES.millstone.venue).toBe('mill');
    expect(failure(city(), place('factoryPress', 2, 2))).toBe('error.unknownCommand');
    expect(failure(city(), place('packhousePacker', 2, 2))).toBe('error.unknownCommand');
    expect(mill(apply(city(), place('millMotor', 2, 2))).interior?.fixtures).toHaveLength(1);
  });

  it('links a Millstone to the Motor that drives it', () => {
    const state = apply(city(), ...fitted);
    const { fixtures } = mill(state).interior!;
    const stone = fixtures.find(fixture => fixture.type === 'millstone')!;
    expect(interiorLinksOf(fixtures).linked.has(stone.id)).toBe(true);
  });
});

describe('the speed a Mill interior adds', () => {
  const bare = apply(city(), ...fitted);
  const withMiller = apply(bare, { type: 'HireInteriorStaff', buildingId: 1, role: 'miller' });

  it('is nothing until a miller is hired, whatever the Machines do', () => {
    expect(interiorBonusOfBuilding(mill(bare)).speed).toBe(0);
    expect(productionDurationOf(mill(bare), 'flour' as never)).toBe(productionDurationOf({ ...mill(bare), interior: undefined }, 'flour' as never));
  });

  it('comes with the miller, capped by the Tier', () => {
    const bonus = interiorBonusOfBuilding(mill(withMiller)).speed;
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(0.26);
    expect(productionDurationOf(mill(withMiller), 'flour' as never)).toBeLessThan(productionDurationOf({ ...mill(withMiller), interior: undefined }, 'flour' as never));
  });

  it('leaves a Mill with an empty interior exactly as it was', () => {
    const empty = apply(city(), { type: 'HireInteriorStaff', buildingId: 1, role: 'miller' });
    expect(interiorBonusOfBuilding(mill(empty))).toEqual({ speed: 0, yield: 0, power: 0 });
  });
});

describe('the Technician of a Mill interior', () => {
  it('is hired from the third Tier, and the Mill is refused one before', () => {
    expect(failure(city(2), { type: 'HireInteriorTechnician', buildingId: 1 })).toBe('error.tierTooLow');
    expect(mill(apply(city(3), { type: 'HireInteriorTechnician', buildingId: 1 })).interior?.technicians).toBe(1);
  });
});
