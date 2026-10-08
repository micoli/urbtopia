import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState } from '../index';
import { ARCADE_FIXTURES, entranceCell, fixtureRefund, priceAcceptance, takingsCapOf, takingsDue, takingsPerHour, venuePerformance, visitorsPerHour, VENUE } from './venues';

const HOUR = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs = 10_000, buildings: Building[] = [building(1, 'arcade', 55, 50), building(2, 'home', 52, 50, { tier: 4 })]): GameState => ({
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
    const far = city(10_000, [building(1, 'arcade', 55, 50), building(2, 'home', 55 + VENUE.reachRadius + 20, 50, { tier: 4 })]);
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
      const tier2 = city(10_000, [building(1, 'arcade', 55, 50, { tier: 2 }), building(2, 'home', 52, 50, { tier: 4 })]);
      const placed = send(tier2, place('billiard', 0, 0));
      const tiles = (state: GameState) => fixtures(state).map(f => [f.x, f.y, f.rotation]);
      expect(tiles(placed)).toEqual([[0, 0, 0]]);
      const turned = send(placed, { type: 'MoveFixture', buildingId: 1, fixtureId: 1, x: 0, y: 0, rotation: 1 });
      expect(tiles(turned)).toEqual([[0, 0, 1]]);
      expect(failure(tier2, place('billiard', 5, 0))).toBe('error.tilesOccupied');
    });
  });

  describe('Revenue model', () => {
    const equipped = (...fixtures: [Parameters<typeof place>[0], number, number][]) => fixtures.reduce((state, [fixture, x, y]) => send(state, place(fixture, x, y)), city(100_000));
    const performance = (state: GameState) => venuePerformance(state, arcadeOf(state) as never);

    it('limits service to the game capacity, and halves it without a counter', () => {
      const bare = equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1]);
      const counted = equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1], ['counter', 3, 1]);
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
      const base = equipped(['barrelClimber', 1, 1], ['counter', 3, 1]);
      const earnings = (price: number) => performance(send(base, { type: 'SetVenuePrice', buildingId: 1, price })).earningsPerHour;
      expect(earnings(VENUE.minPrice)).toBeLessThan(earnings(VENUE.playPrice));
      expect(earnings(VENUE.maxPrice)).toBeLessThan(earnings(VENUE.playPrice + 2));
    });

    it('splits the earnings between the game Fixtures, and none for the others', () => {
      const state = equipped(['barrelClimber', 1, 1], ['spaceShooter', 2, 1], ['counter', 3, 1], ['table', 4, 4]);
      const result = performance(state);
      const total = [...result.earningsByFixture.values()].reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(result.earningsPerHour, 9);
      expect(result.earningsByFixture.size).toBe(2);
    });

    it('validates the price and keeps it in the save state', () => {
      expect(failure(city(), { type: 'SetVenuePrice', buildingId: 1, price: 0 })).toBe('error.invalidPrice');
      expect(failure(city(), { type: 'SetVenuePrice', buildingId: 1, price: VENUE.maxPrice + 1 })).toBe('error.invalidPrice');
      expect(failure(city(), { type: 'SetVenuePrice', buildingId: 1, price: 2.5 })).toBe('error.invalidPrice');
      expect(arcadeOf(send(city(), { type: 'SetVenuePrice', buildingId: 1, price: 4 })).venue!.price).toBe(4);
    });

    it('caps Takings by Tier', () => {
      expect(takingsCapOf(2)).toBeGreaterThan(takingsCapOf(1));
      const rich = { ...equipped(['barrelClimber', 1, 1], ['counter', 3, 1]), lastSeen: 0 };
      const capped = advance(rich, 200 * 3_600_000).state;
      expect(arcadeOf(capped).venue!.takings).toBe(takingsCapOf(1));
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
    const base = furnished(['counter', 3, 1], ['barrelClimber', 0, 4]);
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
