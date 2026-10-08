import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState, type StaffRole } from '../index';
import { economicPower, energyStats } from '../index';
import { jobsOf } from '../traffic/jobs';
import { conditionOf, isBroken, repairCost, technicianRepairCost, STAFF, hiredOf, postsOf, wagesPerHour, priceOf } from './venues';
import { ARCADE_FIXTURES, gridSizeOf, entranceCell, fixtureRefund, priceAcceptance, takingsCapOf, takingsDue, takingsPerHour, venuePerformance, visitorsPerHour, VENUE } from './venues';

const HOUR = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs = 10_000, buildings: Building[] = [building(1, 'arcade', 55, 50), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]): GameState => ({
  ...newGame({ seed: 'venues', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, buildings,
});
const send = (state: GameState, command: Command, now = 0) => {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const arcadeOf = (state: GameState) => state.buildings.find(b => b.type === 'arcade')!;
const place = (fixture: Extract<Command, { type: 'PlaceFixture' }>['fixture'], x: number, y: number, rotation?: 0 | 1 | 2 | 3): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture, x, y, rotation });
const hire = (state: GameState, role: StaffRole, count = 1): GameState => Array.from({ length: count }).reduce<GameState>(current => send(current, { type: 'HireStaff', buildingId: 1, role }), state);
const machine = (x: number, y: number): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture: 'barrelClimber', x, y });

describe('Arcade Venue', () => {
  it('starts empty, with no Takings', () => {
    expect(arcadeOf(city()).venue).toEqual({ fixtures: [], nextFixtureId: 1, takings: 0 });
  });

  it('places a game machine on a free interior cell and pays its price', () => {
    const state = send(city(), machine(2, 3));
    expect(arcadeOf(state).venue!.fixtures).toEqual([{ id: 1, type: 'barrelClimber', x: 2, y: 3, rotation: 0 }]);
    expect(state.urbs).toBe(10_000 - 150);
  });

  it('refuses a cell that is taken, outside the grid, or too expensive', () => {
    const placed = send(city(), machine(2, 3));
    expect(failure(placed, machine(2, 3))).toBe('error.tilesOccupied');
    expect(failure(city(), machine(6, 0))).toBe('error.tilesOccupied');
    expect(failure(city(), machine(-1, 0))).toBe('error.tilesOccupied');
    expect(failure(city(100), machine(0, 0))).toBe('error.notEnoughUrbs');
  });

  it('draws Visitors only from the Homes within reach', () => {
    const near = visitorsPerHour(city(), arcadeOf(city()));
    expect(near).toBeGreaterThan(0);
    const far = city(10_000, [building(1, 'arcade', 55, 50), building(2, 'home', 55 + VENUE.reachRadius + 20, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]);
    expect(visitorsPerHour(far, arcadeOf(far))).toBe(0);
  });

  it('earns nothing without a Fixture, then Visitors x play price up to its capacity', () => {
    const empty = city();
    expect(takingsPerHour(empty, arcadeOf(empty) as never)).toBe(0);
    const equipped = send(empty, machine(0, 0));
    const perHour = takingsPerHour(equipped, arcadeOf(equipped) as never);
    expect(perHour).toBeGreaterThan(0);
    expect(perHour).toBeLessThanOrEqual(6 * VENUE.playPrice);
  });

  it('accumulates Takings over time, capped, and collects them by hand', () => {
    const equipped = send(city(), machine(0, 0));
    const later = advance({ ...equipped, lastSeen: 0 }, 2 * HOUR).state;
    const due = takingsDue(arcadeOf(later).venue!);
    expect(due).toBeGreaterThan(0);
    const collected = send(later, { type: 'Collect', buildingId: 1 }, 2 * HOUR);
    expect(collected.urbs).toBe(later.urbs + due);
    expect(takingsDue(arcadeOf(collected).venue!)).toBe(0);
    expect(failure(collected, { type: 'Collect', buildingId: 1 })).toBe('error.nothingToCollect');

    const capped = advance({ ...equipped, lastSeen: 0 }, 40 * HOUR).state;
    expect(arcadeOf(capped).venue!.takings).toBeLessThanOrEqual(takingsCapOf(1));
  });

  it('gives the same Takings whether replayed in one Catch-up or in steps', () => {
    const equipped = { ...send(city(), machine(0, 0)), lastSeen: 0 };
    const once = advance(equipped, 6 * HOUR).state;
    let stepped = equipped;
    for (let hour = 1; hour <= 6; hour++) stepped = advance(stepped, hour * HOUR).state;
    expect(arcadeOf(stepped).venue!.takings).toBeCloseTo(arcadeOf(once).venue!.takings, 6);
  });

  describe('Fixture editing', () => {
    const fixtures = (state: GameState) => arcadeOf(state).venue!.fixtures;

    it('moves and rotates a Fixture, refusing taken cells and the entrance', () => {
      const placed = send(send(city(), machine(1, 1)), machine(2, 1));
      const moved = send(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: 4, y: 4, rotation: 1 });
      expect(fixtures(moved)[0]).toMatchObject({ x: 4, y: 4, rotation: 1 });
      expect(failure(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: 2, y: 1 })).toBe('error.tilesOccupied');
      const entrance = entranceCell(1);
      expect(failure(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: entrance.x, y: entrance.y })).toBe('error.tilesOccupied');
      expect(failure(city(), machine(entrance.x, entrance.y))).toBe('error.tilesOccupied');
      expect(failure(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 99, x: 0, y: 0 })).toBe('error.unknownFixture');
    });

    it('lets a Fixture be rotated in place', () => {
      const placed = send(city(), machine(1, 1));
      const turned = send(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: 1, y: 1, rotation: 2 });
      expect(fixtures(turned)[0]).toMatchObject({ x: 1, y: 1, rotation: 2 });
    });

    it('refunds half the price when removing a Fixture', () => {
      const placed = send(city(), machine(1, 1));
      const removed = send(placed, { type: 'RemoveFixture', buildingId: 1, fixtureId: 1 });
      expect(fixtures(removed)).toEqual([]);
      expect(removed.urbs).toBe(placed.urbs + fixtureRefund('barrelClimber'));
      expect(fixtureRefund('barrelClimber')).toBe(ARCADE_FIXTURES.barrelClimber.price / 2);
      expect(failure(removed, { type: 'RemoveFixture', buildingId: 1, fixtureId: 1 })).toBe('error.unknownFixture');
    });

    it('locks Fixtures above the Venue Tier', () => {
      expect(failure(city(), place('pinball', 0, 0))).toBe('error.tierTooLow');
      expect(failure(city(), place('billiard', 0, 0))).toBe('error.tierTooLow');
    });

    it('lets a 2x1 Fixture turn into a 1x2 one and blocks it from leaving the grid', () => {
      const tier2 = city(10_000, [building(1, 'arcade', 55, 50, { tier: 2 }), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]);
      const placed = send(tier2, place('billiard', 0, 0));
      const tiles = (state: GameState) => fixtures(state).map(f => [f.x, f.y, f.rotation]);
      expect(tiles(placed)).toEqual([[0, 0, 0]]);
      const turned = send(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: 0, y: 0, rotation: 1 });
      expect(tiles(turned)).toEqual([[0, 0, 1]]);
      expect(failure(tier2, place('billiard', 7, 1))).toBe('error.tilesOccupied');
    });
  });

  describe('Revenue model', () => {
    const equipped = (...fixtures: [Parameters<typeof place>[0], number, number][]) => fixtures.reduce((state, [fixture, x, y]) => send(state, place(fixture, x, y)), city(100_000));
    const performance = (state: GameState) => venuePerformance(state, arcadeOf(state) as never);

    it('limits service to the game capacity, and halves it without a counter', () => {
      const bare = hire(equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1]), 'employee', 2);
      const counted = hire(equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1], ['counter', 3, 1]), 'employee', 2);
      expect(performance(bare).capacity).toBe((6 + 8) * 0.5);
      expect(performance(counted).capacity).toBe(6 + 8);
      expect(performance(counted).served).toBeLessThanOrEqual(performance(counted).capacity);
    });

    it('serves at most the accepted Visitors when there are more machines than Visitors', () => {
      const many = equipped(...Array.from({ length: 5 }, (_, index) => ['airHockey', index, 1] as [Parameters<typeof place>[0], number, number]), ['counter', 0, 2]);
      const result = performance(many);
      expect(result.served).toBeLessThanOrEqual(result.accepted + 1e-9);
    });

    it('loses Visitors when the price is too high, and Takings when it is too low', () => {
      expect(priceAcceptance(VENUE.playPrice)).toBe(1);
      expect(priceAcceptance(VENUE.maxPrice)).toBeLessThan(priceAcceptance(VENUE.playPrice + 1));
      const base = hire(hire(equipped(['barrelClimber', 1, 1], ['counter', 3, 1]), 'employee', 2), 'manager');
      const earnings = (price: number) => performance(send(base, { type: 'SetVenuePrice', buildingId: 1, price })).earningsPerHour;
      expect(earnings(VENUE.minPrice)).toBeLessThan(earnings(VENUE.playPrice));
      expect(earnings(VENUE.maxPrice)).toBeLessThan(earnings(VENUE.playPrice + 2));
    });

    it('splits the earnings between the game Fixtures, and none for the others', () => {
      const state = hire(equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1], ['counter', 3, 1], ['table', 4, 4]), 'employee', 2);
      const result = performance(state);
      const total = [...result.earningsByFixture.values()].reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(result.earningsPerHour, 9);
      expect(result.earningsByFixture.size).toBe(2);
    });

    it('validates the price and keeps it in the save state', () => {
      const managed = hire(city(), 'manager');
      expect(failure(managed, { type: 'SetVenuePrice', buildingId: 1, price: 0 })).toBe('error.invalidPrice');
      expect(failure(managed, { type: 'SetVenuePrice', buildingId: 1, price: VENUE.maxPrice + 1 })).toBe('error.invalidPrice');
      expect(failure(managed, { type: 'SetVenuePrice', buildingId: 1, price: 2.5 })).toBe('error.invalidPrice');
      expect(arcadeOf(send(managed, { type: 'SetVenuePrice', buildingId: 1, price: 4 })).venue!.price).toBe(4);
    });

    it('caps Takings by Tier', () => {
      expect(takingsCapOf(2)).toBeGreaterThan(takingsCapOf(1));
      const staffed = hire(equipped(['barrelClimber', 1, 1], ['counter', 3, 1]), 'employee', 2);
      const nearlyFull: GameState = { ...staffed, lastSeen: 0, buildings: staffed.buildings.map(b => b.type === 'arcade' ? { ...b, venue: { ...b.venue!, takings: takingsCapOf(1) - 1 } } : b) };
      expect(arcadeOf(advance(nearlyFull, 3_600_000).state).venue!.takings).toBe(takingsCapOf(1));
    });
  });
});

describe('Arcade layout rules', () => {
  const entrance = entranceCell(1);
  const furnished = (...fixtures: [Parameters<typeof place>[0], number, number][]) => fixtures.reduce((state, [fixture, x, y]) => send(state, place(fixture, x, y)), city(100_000));
  const layoutOf = (state: GameState) => venuePerformance(state, arcadeOf(state) as never).layout;
  const hintsOf = (state: GameState, id: number) => layoutOf(state).hints.get(id) ?? [];

  it('serves faster when the counter is near the entrance', () => {
    const near = layoutOf(furnished(['counter', entrance.x, entrance.y + 1]));
    const far = layoutOf(furnished(['counter', 0, 5]));
    expect(near.counterRate).toBe(1);
    expect(far.counterRate).toBeLessThan(near.counterRate);
    expect(far.counterRate).toBeGreaterThanOrEqual(0.6);
    expect(layoutOf(city()).counterRate).toBe(0.5);
  });

  it('flags a counter that is too far from the entrance', () => {
    const state = furnished(['counter', 0, 5]);
    expect(hintsOf(state, 1)).toContain('counterFar');
  });

  it('lowers attractiveness for each pair of neighbouring loud machines, never below the floor', () => {
    const apart = layoutOf(furnished(['barrelClimber', 0, 2], ['spaceShooter', 2, 2]));
    const side = furnished(['barrelClimber', 0, 2], ['spaceShooter', 1, 2]);
    expect(apart.attractiveness).toBe(1);
    expect(layoutOf(side).attractiveness).toBeLessThan(1);
    expect(hintsOf(side, 1)).toContain('noise');
    expect(hintsOf(side, 2)).toContain('noise');
    const row = layoutOf(furnished(...[3, 4].flatMap(y => Array.from({ length: 6 }, (_, index) => ['barrelClimber', index, y] as [Parameters<typeof place>[0], number, number]))));
    expect(row.attractiveness).toBe(0.5);
  });

  it('keeps quiet Fixtures from making noise, even next to a loud one', () => {
    const state = furnished(['barrelClimber', 0, 2], ['table', 1, 2]);
    expect(layoutOf(state).attractiveness).toBe(1);
    expect(hintsOf(state, 1)).toEqual([]);
  });

  it('counts a chair only when a table is in reach, four chairs per table', () => {
    const alone = furnished(['chair', 0, 3]);
    expect(layoutOf(alone).seatedIds.size).toBe(0);
    expect(hintsOf(alone, 1)).toContain('noHost');
    const seated = furnished(['table', 2, 3], ['chair', 1, 3], ['chair', 3, 3], ['chair', 2, 2], ['chair', 2, 4]);
    expect(layoutOf(seated).seatedIds.size).toBe(4);
    const tooMany = furnished(['table', 2, 3], ['chair', 1, 3], ['chair', 3, 3], ['chair', 2, 2], ['chair', 2, 4], ['barStool', 1, 4]);
    expect(layoutOf(tooMany).seatedIds.size).toBe(4);
    expect(layoutOf(furnished(['counter', 3, 1], ['barStool', 3, 2])).seatedIds.size).toBe(1);
  });

  it('adds capacity and earnings for seated chairs only', () => {
    const base = hire(furnished(['counter', 3, 1], ['barrelClimber', 0, 4]), 'employee', 2);
    const withSeats = send(send(send(base, place('table', 2, 3)), place('chair', 1, 3)), place('chair', 5, 5));
    const before = venuePerformance(base, arcadeOf(base) as never);
    const after = venuePerformance(withSeats, arcadeOf(withSeats) as never);
    expect(after.capacity).toBe(before.capacity + 2);
    const chairs = arcadeOf(withSeats).venue!.fixtures.filter(fixture => fixture.type === 'chair');
    expect(after.earningsByFixture.has(chairs[0]!.id)).toBe(true);
    expect(after.earningsByFixture.has(chairs[1]!.id)).toBe(false);
  });

  it('changes Takings on the next tick once a Fixture is moved', () => {
    const state = furnished(['counter', 0, 5], ['barrelClimber', 1, 2], ['spaceShooter', 4, 4]);
    const moved = send(state, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: entrance.x, y: entrance.y + 1 });
    expect(takingsPerHour(moved, arcadeOf(moved) as never)).toBeGreaterThan(takingsPerHour(state, arcadeOf(state) as never));
  });
});

describe('Arcade Staff', () => {
  const fitted = () => [['counter', 3, 1], ['barrelClimber', 1, 2], ['spaceShooter', 4, 4]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), city(100_000));
  const performance = (state: GameState) => venuePerformance(state, arcadeOf(state) as never);

  it('hires and releases by role, within the posts of the Tier', () => {
    let state = city();
    for (let index = 0; index < postsOf('employee', 1); index++) state = hire(state, 'employee');
    expect(failure(state, { type: 'HireStaff', buildingId: 1, role: 'employee' })).toBe('error.noStaffPost');
    const released = send(state, { type: 'ReleaseStaff', buildingId: 1, role: 'employee' });
    expect(hiredOf(arcadeOf(released).venue!, 'employee')).toBe(postsOf('employee', 1) - 1);
    expect(failure(city(), { type: 'ReleaseStaff', buildingId: 1, role: 'manager' })).toBe('error.noStaffToRelease');
  });

  it('serves slower without an employee, and at full speed with enough of them', () => {
    const none = performance(fitted()).capacity;
    const one = performance(hire(fitted(), 'employee')).capacity;
    const two = performance(hire(fitted(), 'employee', 2)).capacity;
    expect(none).toBeLessThan(one);
    expect(one).toBeLessThan(two);
    expect(two / one).toBeCloseTo(1 / 0.7, 9);
  });

  it('locks the price to its default without a manager, and adds a yield bonus with one', () => {
    const staffed = hire(fitted(), 'employee', 2);
    expect(failure(staffed, { type: 'SetVenuePrice', buildingId: 1, price: 4 })).toBe('error.managerRequired');
    const withManager = hire(staffed, 'manager');
    const priced = send(withManager, { type: 'SetVenuePrice', buildingId: 1, price: 3 });
    expect(priceOf(arcadeOf(priced).venue!)).toBe(3);
    expect(priceOf(arcadeOf(send(priced, { type: 'ReleaseStaff', buildingId: 1, role: 'manager' })).venue!)).toBe(VENUE.playPrice);
    expect(performance(withManager).grossPerHour).toBeGreaterThan(performance(staffed).grossPerHour);
  });

  it('keeps 10% more Visitors with security', () => {
    const staffed = hire(fitted(), 'employee', 2);
    expect(performance(hire(staffed, 'security')).accepted).toBeCloseTo(performance(staffed).accepted / STAFF.withoutSecurityRate, 9);
  });

  it('takes wages out of the Takings, per hour, never into debt', () => {
    const staffed = { ...hire(hire(fitted(), 'employee', 2), 'security'), lastSeen: 0 };
    const seeded = { ...staffed, buildings: staffed.buildings.map(b => b.id === 1 ? { ...b, venue: { ...b.venue!, takings: 5 } } : b) };
    const net = performance(seeded).grossPerHour - wagesPerHour(arcadeOf(seeded).venue!);
    const later = advance(seeded, 3_600_000).state;
    expect(arcadeOf(later).venue!.takings).toBeCloseTo(5 + net, 6);
    expect(wagesPerHour(arcadeOf(seeded).venue!)).toBeCloseTo((2 * STAFF.dailyWage.employee + STAFF.dailyWage.security) / 24, 9);
  });

  it('closes when the wages cannot be paid, and reopens when they can', () => {
    const overstaffed = { ...hire(hire(hire(city(), 'employee', 2), 'manager'), 'security'), lastSeen: 0 };
    const empty = advance(overstaffed, 24 * 3_600_000).state;
    const closed = performance(empty);
    expect(arcadeOf(empty).venue!.takings).toBe(0);
    expect(closed.closed).toBe(true);
    expect(closed.earningsPerHour).toBe(0);
    const stillClosed = advance(empty, 48 * 3_600_000).state;
    expect(arcadeOf(stillClosed).venue!.takings).toBe(0);
    const trimmed = [...Array(2).fill('employee'), 'manager', 'security'].reduce<GameState>((state, role) => send(state, { type: 'ReleaseStaff', buildingId: 1, role }), empty);
    expect(performance(trimmed).closed).toBe(false);
  });

  it('gives the same Takings in one Catch-up or in steps, wages included', () => {
    const base = { ...hire(hire(fitted(), 'employee', 2), 'manager'), lastSeen: 0 };
    const once = advance(base, 10 * 3_600_000).state;
    let stepped = base;
    for (let hour = 1; hour <= 10; hour++) stepped = advance(stepped, hour * 3_600_000).state;
    expect(arcadeOf(stepped).venue!.takings).toBeCloseTo(arcadeOf(once).venue!.takings, 6);
  });

  it('counts the Staff as Jobs of the Arcade', () => {
    const staffed = hire(hire(city(), 'employee', 2), 'security');
    expect(jobsOf(arcadeOf(staffed))).toBe(3);
    expect(jobsOf(arcadeOf(city()))).toBe(0);
  });
});

describe('Arcade wear and repair', () => {
  const HOURS = 3_600_000;
  const run = (state: GameState, hours: number) => advance({ ...state, lastSeen: 0 }, hours * HOURS).state;
  const base = () => hire(
    [['counter', 3, 1], ['barrelClimber', 1, 2], ['chair', 5, 5]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), city(100_000)),
    'employee', 2,
  );
  const fixtureOf = (state: GameState, type: string) => arcadeOf(state).venue!.fixtures.find(fixture => fixture.type === type)!;
  const withCondition = (state: GameState, type: string, condition: number): GameState => ({
    ...state,
    buildings: state.buildings.map(b => b.type === 'arcade' ? { ...b, venue: { ...b.venue!, fixtures: b.venue!.fixtures.map(f => f.type === type ? { ...f, condition } : f) } } : b),
  });

  it('wears the game Fixtures that serve Visitors, and nothing else', () => {
    const later = run(base(), 4);
    expect(conditionOf(fixtureOf(later, 'barrelClimber'))).toBeLessThan(100);
    expect(conditionOf(fixtureOf(later, 'counter'))).toBe(100);
    expect(conditionOf(fixtureOf(later, 'chair'))).toBe(100);
  });

  it('wears more slowly with a technician', () => {
    const plain = conditionOf(fixtureOf(run(base(), 4), 'barrelClimber'));
    const tended = conditionOf(fixtureOf(run(hire(base(), 'technician'), 4), 'barrelClimber'));
    expect(tended).toBeGreaterThan(plain);
  });

  it('breaks a worn Fixture from the Seed of the Venue, the same way every time', () => {
    const worn = withCondition(base(), 'barrelClimber', 5);
    const first = run(worn, 24), second = run(worn, 24);
    expect(isBroken(fixtureOf(first, 'barrelClimber'))).toBe(true);
    expect(arcadeOf(first).venue!.rng).toBe(arcadeOf(second).venue!.rng);
    expect(arcadeOf(first).venue!.rng).toBeDefined();
    const healthy = run(base(), 2);
    expect(isBroken(fixtureOf(healthy, 'barrelClimber'))).toBe(false);
  });

  it('never breaks a Fixture that is in good shape', () => {
    expect(isBroken(fixtureOf(run(withCondition(base(), 'barrelClimber', 80), 1), 'barrelClimber'))).toBe(false);
  });

  it('stops earning from a broken Fixture', () => {
    const intact = base();
    const broken: GameState = { ...intact, buildings: intact.buildings.map(b => b.type === 'arcade' ? { ...b, venue: { ...b.venue!, fixtures: b.venue!.fixtures.map(f => f.type === 'barrelClimber' ? { ...f, broken: true } : f) } } : b) };
    expect(venuePerformance(broken, arcadeOf(broken) as never).earningsPerHour).toBe(0);
    expect(venuePerformance(intact, arcadeOf(intact) as never).earningsPerHour).toBeGreaterThan(0);
  });

  it('gives the same result in one Catch-up or in steps, breakdowns included', () => {
    const worn = withCondition(base(), 'barrelClimber', 30);
    const once = run(worn, 12);
    let stepped: GameState = { ...worn, lastSeen: 0 };
    for (let hour = 1; hour <= 12; hour++) stepped = advance(stepped, hour * HOURS).state;
    expect(arcadeOf(stepped).venue!.fixtures).toEqual(arcadeOf(once).venue!.fixtures);
    expect(arcadeOf(stepped).venue!.rng).toBe(arcadeOf(once).venue!.rng);
  });

  it('repairs for less than a new Fixture, and restores it', () => {
    const state = withCondition(base(), 'barrelClimber', 20);
    const fixture = fixtureOf(state, 'barrelClimber');
    expect(repairCost(fixture)).toBeGreaterThan(0);
    expect(repairCost(fixture)).toBeLessThan(ARCADE_FIXTURES.barrelClimber.price);
    const repaired = send(state, { type: 'RepairFixture', buildingId: 1, fixtureId: fixture.id });
    expect(conditionOf(fixtureOf(repaired, 'barrelClimber'))).toBe(100);
    expect(repaired.urbs).toBe(state.urbs - repairCost(fixture));
    expect(failure(repaired, { type: 'RepairFixture', buildingId: 1, fixtureId: fixture.id })).toBe('error.nothingToRepair');
    expect(failure({ ...state, urbs: 0 }, { type: 'RepairFixture', buildingId: 1, fixtureId: fixture.id })).toBe('error.notEnoughUrbs');
  });

  it('lets a technician repair broken Fixtures at the Venue expense, cheaper than by hand', () => {
    const worn = hire(withCondition(base(), 'barrelClimber', 10), 'technician');
    const seeded: GameState = { ...worn, buildings: worn.buildings.map(b => b.type === 'arcade' ? { ...b, venue: { ...b.venue!, takings: 100 } } : b) };
    const fixture = fixtureOf(seeded, 'barrelClimber');
    expect(technicianRepairCost(fixture)).toBeLessThan(repairCost(fixture));
    const later = run(seeded, 1);
    expect(conditionOf(fixtureOf(later, 'barrelClimber'))).toBe(100);
    expect(isBroken(fixtureOf(later, 'barrelClimber'))).toBe(false);
  });
});

describe('Arcade Tiers and power', () => {
  const equipped = (state: GameState) => hire(send(send(state, place('barrelClimber', 1, 2)), place('counter', 3, 1)), 'employee', 2);
  const performance = (state: GameState) => venuePerformance(state, arcadeOf(state) as never);
  const withoutPower = (state: GameState): GameState => ({ ...state, buildings: state.buildings.filter(b => b.type !== 'coalPlant') });

  it('upgrades for Urbs, keeping the Fixtures where they are and growing the grid', () => {
    const start = equipped(city(100_000));
    const upgraded = send(start, { type: 'UpgradeBuilding', buildingId: 1 });
    expect(arcadeOf(upgraded).tier).toBe(2);
    expect(upgraded.urbs).toBe(start.urbs - VENUE.upgradeCosts[2]!);
    expect(arcadeOf(upgraded).venue!.fixtures).toEqual(arcadeOf(start).venue!.fixtures);
    expect(gridSizeOf(2)).toBeGreaterThan(gridSizeOf(1));
    expect(failure(city(10), { type: 'UpgradeBuilding', buildingId: 1 })).toBe('error.notEnoughUrbs');
    const top = send(upgraded, { type: 'UpgradeBuilding', buildingId: 1 });
    expect(arcadeOf(top).tier).toBe(3);
    expect(failure(top, { type: 'UpgradeBuilding', buildingId: 1 })).toBe('error.maxTier');
  });

  it('keeps the entrance on the same cell at every Tier, and places a Fixture on the new cells', () => {
    expect(entranceCell(3)).toEqual(entranceCell(1));
    const upgraded = send(city(100_000), { type: 'UpgradeBuilding', buildingId: 1 });
    expect(arcadeOf(send(upgraded, place('barrelClimber', 7, 7))).venue!.fixtures).toHaveLength(1);
  });

  it('raises the Staff posts, the Takings cap and unlocks Fixtures with the Tier', () => {
    expect(postsOf('employee', 3)).toBeGreaterThan(postsOf('employee', 1));
    expect(takingsCapOf(3)).toBeGreaterThan(takingsCapOf(2));
    const upgraded = send(city(100_000), { type: 'UpgradeBuilding', buildingId: 1 });
    expect(failure(upgraded, place('billiard', 0, 0))).toBeNull();
    expect(failure(upgraded, place('basketball', 0, 0))).toBe('error.tierTooLow');
  });

  it('asks for more power with each Tier', () => {
    expect(economicPower(createBuilding(1, 'arcade', 0, 0, 0))).toBeGreaterThan(0);
    expect(economicPower({ ...createBuilding(1, 'arcade', 0, 0, 0), tier: 3 })).toBe(3 * economicPower(createBuilding(1, 'arcade', 0, 0, 0)));
  });

  it('shuts without power: it earns nothing, pays nothing and does not wear', () => {
    const dark = withoutPower(equipped(city(100_000)));
    const result = performance(dark);
    expect(result.powered).toBe(false);
    expect(result.earningsPerHour).toBe(0);
    const later = advance({ ...dark, lastSeen: 0 }, 6 * 3_600_000).state;
    expect(arcadeOf(later).venue).toEqual(arcadeOf(dark).venue);
  });

  it('stays open during an Adaptation period', () => {
    const dark = { ...withoutPower(equipped(city(100_000))), adaptationUntil: 10 * 3_600_000, lastSeen: 0 };
    expect(performance(dark).powered).toBe(true);
    expect(performance(dark).earningsPerHour).toBeGreaterThan(0);
  });

  it('is shed after the Casino when power falls short', () => {
    const short: GameState = { ...city(), buildings: [building(1, 'arcade', 55, 50), building(2, 'casino', 60, 50, { tier: 3 }), building(3, 'coalPlant', 90, 40, { tier: 1 })] };
    const supplied = energyStats(short).supplied;
    expect(supplied.get(1)).toBeCloseTo(economicPower(short.buildings[0]!), 9);
    expect(supplied.get(2)!).toBeLessThan(economicPower(short.buildings[1]!));
  });
});
