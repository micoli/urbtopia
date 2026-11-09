import { beforeEach, describe, expect, it } from 'vitest';
import { advance, conditionOf, createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { fixtureRefund } from '../venues/venues';
import { WEAR, repairCost } from '../venues/wear';
import { STAFF } from '../venues/staff';
import { floorUsageOf, technicianPostsOf } from './floorWear';

const H = 3_600_000;
let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0, extra: Partial<VenueFixture> = {}): VenueFixture => ({ id: nextId++, type, x, y, rotation, ...extra });

// A Tank, a Pump behind it and a Motor beside it, which hands the Pump its Drive: the Flow leaves the Pump through its front.
const pumped = (x: number, y: number, rotation: 0 | 2 = 0): VenueFixture[] => (rotation === 0
  ? [put('factoryTank', x, y - 1), put('factoryPump', x, y), put('factoryMotor', x + 1, y, 1)]
  : [put('factoryTank', x, y + 1, 2), put('factoryPump', x, y, 2), put('factoryMotor', x - 1, y, 3)]);

// A Motor, a Shaft and a Press that run, a Pump with a Pipe and a Vat that run, and a Gear that nothing feeds.
const running = () => {
  nextId = 1;
  return [put('factoryMotor', 2, 1), put('factoryShaft', 2, 2), put('factoryPress', 2, 3, 2), ...pumped(6, 1), put('factoryPipe', 6, 2), put('factoryMixingVat', 6, 3, 2)];
};

beforeEach(() => {
  nextId = 1;
});

const city = (fixtures: VenueFixture[], extra: Partial<Building['floor'] & object> = {}, tier = 5): GameState => ({
  ...newGame({ seed: 'floor-wear', now: 0 }),
  nextId: 100,
  urbs: 1_000_000,
  tutorial: null,
  lastSeen: 0,
  adaptationUntil: Number.MAX_SAFE_INTEGER,
  buildings: [{ ...createBuilding(1, 'factory', 55, 50, 0), tier, floor: { fixtures, nextFixtureId: 1000, ...extra } }],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  return result.ok ? null : result.error.key;
};
const floorOf = (state: GameState) => state.buildings[0]!.floor!;
const conditionById = (state: GameState, id: number) => conditionOf(floorOf(state).fixtures.find(fixture => fixture.id === id)!);

describe('what runs on a Factory floor', () => {
  it('counts the Fixtures that turn and the ones Flow serves, and nothing that is idle', () => {
    const fixtures = [...running(), put('factoryGear', 9, 9)];
    const used = floorUsageOf(fixtures);
    for (const fixture of fixtures.slice(0, 8)) expect(used.has(fixture.id)).toBe(true);
    expect(used.has(fixtures[8]!.id)).toBe(false);
  });
});

describe('wear of a Factory floor', () => {
  it('wears what runs, hour after hour, and leaves what is idle', () => {
    const fixtures = [...running(), put('factoryGear', 9, 9)];
    const state = advance(city(fixtures), 3 * H).state;
    expect(conditionById(state, fixtures[0]!.id)).toBeLessThan(100);
    expect(conditionById(state, fixtures[3]!.id)).toBeLessThan(100);
    expect(conditionById(state, fixtures[8]!.id)).toBe(100);
  });

  it('wears nothing on an empty floor or a Factory with no floor', () => {
    expect(advance(city([]), 3 * H).state.buildings[0]!.floor?.fixtures).toEqual([]);
    const bare: GameState = { ...city([]), buildings: [{ ...createBuilding(1, 'factory', 55, 50, 0), tier: 5 }] };
    expect(advance(bare, 3 * H).state.buildings[0]!.floor).toBeUndefined();
  });

  it('breaks a worn Fixture at an hour boundary, the same way every time', () => {
    const worn = () => running().map(fixture => ({ ...fixture, condition: 5 }));
    const first = advance(city(worn()), 100 * H).state;
    const again = advance(city(worn()), 100 * H).state;
    expect(floorOf(first).fixtures.some(fixture => fixture.broken)).toBe(true);
    expect(floorOf(first)).toEqual(floorOf(again));
  });

  it('stops a broken Fixture from linking what lies downstream', () => {
    const fixtures = running().map(fixture => (fixture.type === 'factoryShaft' ? { ...fixture, condition: 0, broken: true as const } : fixture));
    expect(floorUsageOf(fixtures).has(fixtures[2]!.id)).toBe(false);
  });
});

describe('repairing a Fixture of a Factory floor', () => {
  const worn = () => city(running().map(fixture => ({ ...fixture, condition: 30 })));

  it('restores the Condition for less than the price of the Fixture', () => {
    const before = worn();
    const state = send(before, { type: 'RepairFloorFixture', buildingId: 1, fixtureId: floorOf(before).fixtures[0]!.id });
    const repaired = floorOf(state).fixtures[0]!;
    expect(conditionOf(repaired)).toBe(100);
    expect(before.urbs - state.urbs).toBe(repairCost(floorOf(before).fixtures[0]!));
    expect(repairCost(floorOf(before).fixtures[0]!)).toBeLessThan(fixtureRefund('factoryMotor') * 2);
  });

  it('is refused for a Fixture in good state, one that does not exist, or when the city cannot pay', () => {
    expect(failure(city(running()), { type: 'RepairFloorFixture', buildingId: 1, fixtureId: 1 })).toBe('error.nothingToRepair');
    expect(failure(worn(), { type: 'RepairFloorFixture', buildingId: 1, fixtureId: 4242 })).toBe('error.unknownFixture');
    expect(failure({ ...worn(), urbs: 0 }, { type: 'RepairFloorFixture', buildingId: 1, fixtureId: floorOf(worn()).fixtures[0]!.id })).toBe('error.notEnoughUrbs');
  });

  it('repairs a broken Fixture', () => {
    const state = city([put('factoryMotor', 2, 1, 0, { condition: 10, broken: true })]);
    const repaired = floorOf(send(state, { type: 'RepairFloorFixture', buildingId: 1, fixtureId: 1 })).fixtures[0]!;
    expect(repaired.broken).toBeUndefined();
    expect(conditionOf(repaired)).toBe(100);
  });
});

describe('the Technician of a Factory floor', () => {
  it('is hired for a fee, from the Tier that has a post for one, and released for free', () => {
    expect(technicianPostsOf(1)).toBe(0);
    expect(failure(city([], {}, 1), { type: 'HireFloorTechnician', buildingId: 1 })).toBe('error.tierTooLow');
    const hired = send(city([], {}, 3), { type: 'HireFloorTechnician', buildingId: 1 });
    expect(floorOf(hired).technicians).toBe(1);
    expect(city([], {}, 3).urbs - hired.urbs).toBe(STAFF.dailyWage.technician * STAFF.hireFeeDays);
    expect(failure(hired, { type: 'HireFloorTechnician', buildingId: 1 })).toBe('error.noStaffPost');
    expect(floorOf(send(hired, { type: 'ReleaseFloorTechnician', buildingId: 1 })).technicians).toBe(0);
    expect(failure(city([], {}, 3), { type: 'ReleaseFloorTechnician', buildingId: 1 })).toBe('error.noStaffToRelease');
  });

  it('refuses a hire the city cannot pay', () => {
    expect(failure({ ...city([], {}, 3), urbs: 1 }, { type: 'HireFloorTechnician', buildingId: 1 })).toBe('error.notEnoughUrbs');
  });

  it('repairs worn Fixtures by itself and slows the wear', () => {
    const wornFixtures = () => running().map(fixture => ({ ...fixture, condition: 20 }));
    const without = advance(city(wornFixtures(), {}, 3), 2 * H).state;
    const withTechnician = advance(city(wornFixtures(), { technicians: 1 }, 3), 2 * H).state;
    const mean = (state: GameState) => floorOf(state).fixtures.reduce((total, fixture) => total + conditionOf(fixture), 0) / floorOf(state).fixtures.length;
    expect(mean(withTechnician)).toBeGreaterThan(mean(without));
    expect(WEAR.technicianRepairRatio).toBeLessThan(1);
  });

  it('is paid by the hour out of the Urbs of the city', () => {
    const paid = advance(city([put('factoryGear', 2, 1)], { technicians: 1 }, 3), 5 * H).state;
    const unpaid = advance(city([put('factoryGear', 2, 1)], {}, 3), 5 * H).state;
    expect(unpaid.urbs - paid.urbs).toBeCloseTo(5 * STAFF.dailyWage.technician / STAFF.dayHours, 5);
  });
});
