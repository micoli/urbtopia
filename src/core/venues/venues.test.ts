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
      expect(performance(bare).capacity).toBe((6 + 8) * VENUE.withoutCounterRate);
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
