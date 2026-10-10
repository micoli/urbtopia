import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState, type StaffRole } from '../index';
import { economicPower, energyStats, upgradeCostOf } from '../index';
import { EVENT, eventBudgetOf, eventMultiplierOf } from './venues';
import { jobsOf } from '../traffic/jobs';
import { conditionOf, isBroken, repairCost, technicianRepairCost, STAFF, hiredOf, postsOf, wagesPerHour, priceOf } from './venues';
import { VENUE_PROFILES, FIXTURES, hireFeeOf, minTierOfRole, rankOf, gridSizeOf, entranceCell, fixtureRefund, priceAcceptance, takingsCapOf, takingsDue, takingsPerHour, venuePerformance, visitorsPerHour, VENUE } from './venues';

const HOUR = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs = 10_000, buildings: Building[] = [building(1, 'arcade', 55, 50), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]): GameState => ({
  ...newGame({ seed: 'venues', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, buildings,
});
// An Arcade at Tier 2 that has already earned Rank 2: its catalogue opens, events included.
const grown = (urbs = 100_000): GameState => city(urbs, [building(1, 'arcade', 55, 50, { tier: 2, venue: { fixtures: [], nextFixtureId: 1, takings: 0, earned: VENUE_PROFILES.arcade.rankAt[0] } }), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]);
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
// Staff set straight in the state: the tests of the rules are not about the hiring conditions, which have their own tests.
const hire = (state: GameState, role: StaffRole, count = 1): GameState => ({
  ...state,
  buildings: state.buildings.map(candidate => (candidate.id === 1 && candidate.venue ? { ...candidate, venue: { ...candidate.venue, staff: { ...candidate.venue.staff, [role]: (candidate.venue.staff?.[role] ?? 0) + count } } } : candidate)),
});
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
    const near = visitorsPerHour(city(), arcadeOf(city()) as never);
    expect(near).toBeGreaterThan(0);
    const far = city(10_000, [building(1, 'arcade', 55, 50), building(2, 'home', 55 + VENUE.reachRadius + 20, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })]);
    expect(visitorsPerHour(far, arcadeOf(far) as never)).toBe(0);
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
    expect(arcadeOf(capped).venue!.takings).toBeLessThanOrEqual(takingsCapOf('arcade', 1));
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
      expect(fixtureRefund('barrelClimber')).toBe(FIXTURES.barrelClimber.price / 2);
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
    const equipped = (...fixtures: [Parameters<typeof place>[0], number, number][]) => fixtures.reduce((state, [fixture, x, y]) => send(state, place(fixture, x, y)), grown());
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
      expect(takingsCapOf('arcade', 2)).toBeGreaterThan(takingsCapOf('arcade', 1));
      const staffed = hire(equipped(['barrelClimber', 1, 1], ['counter', 3, 1]), 'employee', 2);
      const nearlyFull: GameState = { ...staffed, lastSeen: 0, buildings: staffed.buildings.map(b => b.type === 'arcade' ? { ...b, venue: { ...b.venue!, takings: takingsCapOf('arcade', 2) - 1 } } : b) };
      expect(arcadeOf(advance(nearlyFull, 3_600_000).state).venue!.takings).toBe(takingsCapOf('arcade', 2));
    });
  });
});

describe('Arcade layout rules', () => {
  const entrance = entranceCell(1);
  const furnished = (...fixtures: [Parameters<typeof place>[0], number, number][]) => fixtures.reduce((state, [fixture, x, y]) => send(state, place(fixture, x, y)), grown());
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
  const fitted = () => [['counter', 3, 1], ['barrelClimber', 1, 2], ['spaceShooter', 4, 4]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), grown());
  const performance = (state: GameState) => venuePerformance(state, arcadeOf(state) as never);

  it('hires and releases by role, within the posts of the Tier', () => {
    let state = city();
    for (let index = 0; index < postsOf('arcade', 'employee', 1); index++) state = hire(state, 'employee');
    expect(failure(state, { type: 'HireStaff', buildingId: 1, role: 'employee' })).toBe('error.noStaffPost');
    const released = send(state, { type: 'ReleaseStaff', buildingId: 1, role: 'employee' });
    expect(hiredOf(arcadeOf(released).venue!, 'employee')).toBe(postsOf('arcade', 'employee', 1) - 1);
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
    [['counter', 3, 1], ['barrelClimber', 1, 2], ['chair', 5, 5]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), grown()),
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
    expect(repairCost(fixture)).toBeLessThan(FIXTURES.barrelClimber.price);
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
    expect(upgraded.urbs).toBe(start.urbs - upgradeCostOf('arcade', 2)!.urbs);
    expect(arcadeOf(upgraded).venue!.fixtures).toEqual(arcadeOf(start).venue!.fixtures);
    expect(gridSizeOf('arcade', 2)).toBeGreaterThan(gridSizeOf('arcade', 1));
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
    expect(postsOf('arcade', 'employee', 3)).toBeGreaterThan(postsOf('arcade', 'employee', 1));
    expect(takingsCapOf('arcade', 3)).toBeGreaterThan(takingsCapOf('arcade', 2));
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

describe('Arcade events', () => {
  const H = 3_600_000;
  const staffedCity = () => {
    const base = hire(hire(grown(), 'manager'), 'employee', 2);
    return [['counter', 3, 1], ['barrelClimber', 1, 2], ['spaceShooter', 2, 4], ['airHockey', 5, 3]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), base);
  };
  const schedule = (state: GameState, hours = 1) => send(state, { type: 'ScheduleEvent', buildingId: 1, startsInHours: hours });
  const takings = (state: GameState) => arcadeOf(state).venue!.takings;

  it('needs a manager, a valid start, and the budget', () => {
    expect(failure(hire(city(100_000), 'employee'), { type: 'ScheduleEvent', buildingId: 1, startsInHours: 1 })).toBe('error.managerRequired');
    expect(failure(staffedCity(), { type: 'ScheduleEvent', buildingId: 1, startsInHours: -1 })).toBe('error.invalidEventStart');
    expect(failure(staffedCity(), { type: 'ScheduleEvent', buildingId: 1, startsInHours: EVENT.maxDelayHours + 1 })).toBe('error.invalidEventStart');
    expect(failure({ ...staffedCity(), urbs: 10 }, { type: 'ScheduleEvent', buildingId: 1, startsInHours: 1 })).toBe('error.notEnoughUrbs');
  });

  it('debits the budget at scheduling, and allows one event at a time', () => {
    const before = staffedCity();
    const planned = schedule(before);
    expect(planned.urbs).toBe(before.urbs - eventBudgetOf('arcade', 2));
    expect(arcadeOf(planned).venue!.event).toMatchObject({ budget: eventBudgetOf('arcade', 2), endsAt: arcadeOf(planned).venue!.event!.startsAt + EVENT.durationMs });
    expect(failure(planned, { type: 'ScheduleEvent', buildingId: 1, startsInHours: 5 })).toBe('error.eventBusy');
  });

  it('multiplies the Visitors only while the event runs', () => {
    const planned = { ...schedule(staffedCity(), 2), lastSeen: 0 };
    const at = (time: number) => venuePerformance({ ...planned, lastSeen: time }, arcadeOf(planned) as never).visitors;
    const accepted = (time: number) => venuePerformance({ ...planned, lastSeen: time }, arcadeOf(planned) as never).accepted;
    expect(accepted(1 * H)).toBe(accepted(0));
    expect(accepted(2.5 * H)).toBeCloseTo(accepted(0) * eventMultiplierOf('arcade', 2), 9);
    expect(accepted(6 * H)).toBe(accepted(0));
    expect(at(2.5 * H)).toBe(at(0));
  });

  it('raises the Takings of the event window, within the capacity of the Fixtures', () => {
    const plain = { ...staffedCity(), lastSeen: 0 };
    const planned = { ...schedule(staffedCity(), 1), lastSeen: 0 };
    const withEvent = advance(planned, 6 * H).state;
    const without = advance(plain, 6 * H).state;
    expect(takings(withEvent)).toBeGreaterThan(takings(without));
    const free = venuePerformance({ ...planned, lastSeen: 1.5 * H }, arcadeOf(planned) as never);
    expect(free.served).toBeLessThanOrEqual(free.capacity + 1e-9);
  });

  it('survives a Catch-up over the event, the same as stepping through it', () => {
    const planned = { ...schedule(staffedCity(), 2), lastSeen: 0 };
    const once = advance(planned, 12 * H).state;
    let stepped = planned;
    for (let hour = 1; hour <= 12; hour++) stepped = advance(stepped, hour * H).state;
    expect(takings(stepped)).toBeCloseTo(takings(once), 6);
    expect(arcadeOf(once).venue!.event).toBeUndefined();
    expect(arcadeOf(stepped).venue!.event).toBeUndefined();
    expect(arcadeOf(once).venue!.cooldownUntil).toBe(2 * H + EVENT.durationMs + EVENT.cooldownMs);
  });

  it('starts and ends on the exact boundaries, even inside a long gap', () => {
    const planned = { ...schedule(staffedCity(), 1), lastSeen: 0 };
    const half = advance(planned, 2 * H).state;
    expect(arcadeOf(half).venue!.event).toBeDefined();
    const done = advance(half, 4 * H + 1).state;
    expect(arcadeOf(done).venue!.event).toBeUndefined();
  });

  it('keeps a cooldown after an event', () => {
    const planned = { ...schedule(staffedCity(), 0), lastSeen: 0 };
    const after = advance(planned, EVENT.durationMs + H).state;
    expect(failure(after, { type: 'ScheduleEvent', buildingId: 1, startsInHours: 0 })).toBe('error.eventCooldown');
    const later = advance(after, EVENT.durationMs + EVENT.cooldownMs + H).state;
    expect(failure(later, { type: 'ScheduleEvent', buildingId: 1, startsInHours: 0 })).toBeNull();
  });

  it('cancels a planned event for half the budget, but not one that has started', () => {
    const planned = schedule(staffedCity(), 3);
    const cancelled = send(planned, { type: 'CancelEvent', buildingId: 1 });
    expect(cancelled.urbs).toBe(planned.urbs + Math.floor(eventBudgetOf('arcade', 2) / 2));
    expect(arcadeOf(cancelled).venue!.event).toBeUndefined();
    expect(failure(cancelled, { type: 'CancelEvent', buildingId: 1 })).toBe('error.noEvent');
    const running = advance({ ...schedule(staffedCity(), 0), lastSeen: 0 }, H).state;
    expect(failure(running, { type: 'CancelEvent', buildingId: 1 })).toBe('error.eventStarted');
  });

  it('grows the multiplier and the budget with the Tier', () => {
    expect(eventMultiplierOf('arcade', 3)).toBeGreaterThan(eventMultiplierOf('arcade', 1));
    expect(eventBudgetOf('arcade', 3)).toBeGreaterThan(eventBudgetOf('arcade', 1));
  });
});

describe('Visitor satisfaction', () => {
  const fixtured = () => [['counter', 3, 1], ['barrelClimber', 1, 2], ['spaceShooter', 4, 4]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), hire(grown(), 'employee', 2));
  const mood = (state: GameState) => venuePerformance(state, arcadeOf(state) as never).satisfaction;

  it('stays between 0 and 1', () => {
    for (const state of [city(), fixtured(), hire(fixtured(), 'manager')]) {
      expect(mood(state)).toBeGreaterThanOrEqual(0);
      expect(mood(state)).toBeLessThanOrEqual(1);
    }
  });

  it('falls when the Visitors wait for the service, and when the price is too high', () => {
    const slow = hire(city(100_000), 'employee', 0);
    const crowded = [['counter', 3, 1], ['barrelClimber', 1, 2]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), slow);
    expect(mood(crowded)).toBeLessThan(mood(fixtured()));
    const managed = hire(fixtured(), 'manager');
    const priced = (price: number) => mood(send(managed, { type: 'SetVenuePrice', buildingId: 1, price }));
    expect(priced(6)).toBeLessThan(priced(2));
  });

  it('rises with a counter near the entrance and quiet machines', () => {
    const near = mood(fixtured());
    const far = mood([['counter', 0, 5], ['barrelClimber', 1, 2], ['spaceShooter', 2, 2]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), hire(grown(), 'employee', 2)));
    expect(far).toBeLessThan(near);
  });
});

describe('Walls', () => {
  const walled = () => [['arcadeWall', 0, 3], ['arcadeWall', 1, 3], ['arcadeWindow', 2, 3]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), grown());
  const staffedGame = (state: GameState) => hire([['counter', 3, 1], ['barrelClimber', 1, 2]].reduce((current, [fixture, x, y]) => send(current, place(fixture as never, x as number, y as number)), state), 'employee', 2);

  it('are Fixtures of their own kind of Venue, in a section of their own', () => {
    expect(FIXTURES.arcadeWall.category).toBe('walls');
    expect(FIXTURES.marketWindow.venue).toBe('supermarket');
    expect(FIXTURES.hotelWall.venue).toBe('hotel');
    expect(failure(city(), place('marketWall', 1, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('hotelWindow', 1, 1))).toBe('error.unknownCommand');
  });

  it('take a cell, which nothing else can use, and cannot stand on the entrance', () => {
    const state = walled();
    expect(failure(state, place('barrelClimber', 0, 3))).toBe('error.tilesOccupied');
    expect(failure(state, place('arcadeWall', 1, 3))).toBe('error.tilesOccupied');
    const entrance = entranceCell(1);
    expect(failure(city(), place('arcadeWall', entrance.x, entrance.y))).toBe('error.tilesOccupied');
  });

  it('turn, move and are sold for half the price like any Fixture', () => {
    const state = walled();
    const wall = arcadeOf(state).venue!.fixtures[0]!;
    const turned = send(state, { type: 'MoveFixture', buildingId: 1, fixtureId: wall.id, x: wall.x, y: wall.y, rotation: 1 });
    expect(arcadeOf(turned).venue!.fixtures[0]!.rotation).toBe(1);
    const sold = send(state, { type: 'RemoveFixture', buildingId: 1, fixtureId: wall.id });
    expect(sold.urbs).toBe(state.urbs + fixtureRefund('arcadeWall'));
    expect(fixtureRefund('arcadeWall')).toBe(FIXTURES.arcadeWall.price / 2);
  });

  it('earn nothing, serve nothing and never wear', () => {
    const plain = staffedGame(city(100_000));
    const withWalls = [['arcadeWall', 0, 4], ['arcadeWindow', 1, 4]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), plain);
    const before = venuePerformance(plain, arcadeOf(plain) as never);
    const after = venuePerformance(withWalls, arcadeOf(withWalls) as never);
    expect(after.earningsPerHour).toBeCloseTo(before.earningsPerHour, 9);
    expect(after.capacity).toBeCloseTo(before.capacity, 9);
    expect(after.layout.attractiveness).toBe(before.layout.attractiveness);
    const walls = arcadeOf(withWalls).venue!.fixtures.filter(f => FIXTURES[f.type].partition).map(f => f.id);
    for (const id of walls) {
      expect(after.earningsByFixture.has(id)).toBe(false);
      expect(after.usageByFixture.has(id)).toBe(false);
    }
    const later = advance({ ...withWalls, lastSeen: 0 }, 48 * 3_600_000).state;
    for (const fixture of arcadeOf(later).venue!.fixtures.filter(f => FIXTURES[f.type].partition)) {
      expect(fixture.condition).toBeUndefined();
      expect(fixture.broken).toBeUndefined();
    }
  });
});

describe('Venue progression', () => {
  const withEarned = (state: GameState, earned: number): GameState => ({ ...state, buildings: state.buildings.map(b => (b.type === 'arcade' ? { ...b, venue: { ...b.venue!, earned } } : b)) });
  const [rank2, rank3] = VENUE_PROFILES.arcade.rankAt;

  it('earns its Rank by trading, not by paying', () => {
    expect(rankOf('arcade', { fixtures: [], nextFixtureId: 1, takings: 0 })).toBe(1);
    expect(rankOf('arcade', { fixtures: [], nextFixtureId: 1, takings: 0, earned: rank2 - 1 })).toBe(1);
    expect(rankOf('arcade', { fixtures: [], nextFixtureId: 1, takings: 0, earned: rank2 })).toBe(2);
    expect(rankOf('arcade', { fixtures: [], nextFixtureId: 1, takings: 0, earned: rank3 })).toBe(3);
  });

  it('adds what the Venue nets to its earnings, and nothing while it is shut or full', () => {
    const staffed = { ...hire(grown(), 'employee'), lastSeen: 0 };
    const open = [['counter', 3, 1], ['barrelClimber', 1, 2]].reduce((state, [fixture, x, y]) => send(state, place(fixture as never, x as number, y as number)), staffed);
    const later = advance(open, 3 * HOUR).state;
    expect(arcadeOf(later).venue!.earned! - rank2).toBeCloseTo(arcadeOf(later).venue!.takings, 6);
    const nearlyFull: GameState = { ...open, buildings: open.buildings.map(b => (b.type === 'arcade' ? { ...b, venue: { ...b.venue!, takings: takingsCapOf('arcade', 2) - 1, earned: 0 } } : b)) };
    const full = advance(nearlyFull, HOUR).state;
    expect(arcadeOf(full).venue!.takings).toBe(takingsCapOf('arcade', 2));
    expect(arcadeOf(full).venue!.earned).toBeCloseTo(1, 6);
    const capped = advance(full, 2 * HOUR).state;
    expect(arcadeOf(capped).venue!.earned).toBeCloseTo(1, 6);
  });

  it('locks the strongest Fixtures behind the Rank as well as the Tier', () => {
    const tier2 = withEarned(grown(), 0);
    expect(failure(tier2, place('pinball', 0, 0))).toBe('error.rankTooLow');
    expect(failure(withEarned(tier2, rank2), place('pinball', 0, 0))).toBeNull();
  });

  it('opens events from Rank 2', () => {
    const staffed = hire(withEarned(grown(), rank2 - 1), 'manager');
    expect(failure(staffed, { type: 'ScheduleEvent', buildingId: 1, startsInHours: 1 })).toBe('error.rankTooLow');
    expect(failure(withEarned(staffed, rank2), { type: 'ScheduleEvent', buildingId: 1, startsInHours: 1 })).toBeNull();
  });
});

describe('Venue hiring', () => {
  const hireCommand = (role: StaffRole): Command => ({ type: 'HireStaff', buildingId: 1, role });

  it('keeps the roles of the later Tiers locked until the Venue grows', () => {
    expect(failure(city(), hireCommand('manager'))).toBe('error.tierTooLow');
    expect(failure(city(), hireCommand('technician'))).toBe('error.tierTooLow');
    expect(failure(grown(), hireCommand('technician'))).toBe('error.tierTooLow');
    expect(failure(grown(), hireCommand('manager'))).toBeNull();
    expect(minTierOfRole('arcade', 'manager')).toBe(2);
    expect(minTierOfRole('arcade', 'technician')).toBe(3);
    expect(minTierOfRole('arcade', 'employee')).toBe(1);
  });

  it('charges the hiring fee once, in Urbs', () => {
    const state = city(1_000);
    const hired = send(state, hireCommand('employee'));
    expect(hired.urbs).toBe(1_000 - hireFeeOf('employee'));
    expect(hireFeeOf('employee')).toBe(STAFF.dailyWage.employee * STAFF.hireFeeDays);
    const released = send(hired, { type: 'ReleaseStaff', buildingId: 1, role: 'employee' });
    expect(released.urbs).toBe(hired.urbs);
    expect(failure(city(hireFeeOf('employee') - 1), hireCommand('employee'))).toBe('error.notEnoughUrbs');
  });

  it('starts a Venue with a single employee post', () => {
    expect(postsOf('arcade', 'employee', 1)).toBe(1);
    expect(failure(hire(city(), 'employee'), hireCommand('employee'))).toBe('error.noStaffPost');
  });
});
