import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type StaffRole } from '../index';
import { HOTEL, VENUE_PROFILES, cityAttractiveness, priceMultiplier, reputationOf, roomsOf, venuePerformance } from './venues';

const H = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (extra: Building[] = [], urbs = 100_000): GameState => ({
  ...newGame({ seed: 'hotel', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [building(1, 'hotel', 55, 50), building(3, 'coalPlant', 90, 40, { tier: 4 }), ...extra],
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
const inn = (state: GameState) => state.buildings.find(b => b.type === 'hotel')!;
const place = (fixture: FixtureId, x: number, y: number): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture, x, y });
const furnish = (state: GameState, ...items: [FixtureId, number, number][]) => items.reduce((current, [fixture, x, y]) => send(current, place(fixture, x, y)), state);
// Staff set straight in the state: the tests of the rules are not about the hiring conditions, which have their own tests.
const hire = (state: GameState, role: StaffRole, count = 1): GameState => ({
  ...state,
  buildings: state.buildings.map(candidate => (candidate.id === 1 && candidate.venue ? { ...candidate, venue: { ...candidate.venue, staff: { ...candidate.venue.staff, [role]: (candidate.venue.staff?.[role] ?? 0) + count } } } : candidate)),
});
const performance = (state: GameState) => venuePerformance(state, inn(state) as never);
const funded = (state: GameState, takings = 1000): GameState => ({ ...state, buildings: state.buildings.map(b => b.type === 'hotel' ? { ...b, venue: { ...b.venue!, takings } } : b) });
const ranked = (state: GameState, earned: number): GameState => ({ ...state, buildings: state.buildings.map(b => (b.type === 'hotel' ? { ...b, venue: { ...b.venue!, earned } } : b)) });
// Tier 3 and the top Rank: the whole catalogue.
const upgraded = (state: GameState) => ranked(send(send(state, { type: 'UpgradeBuilding', buildingId: 1 }), { type: 'UpgradeBuilding', buildingId: 1 }), VENUE_PROFILES.hotel.rankAt[1]);

// One complete room: a bed and a toilet, next to a reception desk.
const basic = () => hire(furnish(city(), ['receptionDesk', 3, 1], ['singleBed', 0, 3], ['toilet', 1, 3]), 'receptionist');

describe('Hotel Venue', () => {
  it('is a Venue of its own, with Furniture Kit Fixtures only', () => {
    expect(inn(city()).venue).toEqual({ fixtures: [], nextFixtureId: 1, takings: 0 });
    expect(failure(city(), place('counter', 1, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('checkout', 1, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('bunkBed', 1, 1))).toBe('error.tierTooLow');
  });

  it('counts a room only with a bathroom within reach', () => {
    const lonely = furnish(city(), ['singleBed', 0, 3]);
    expect(roomsOf(inn(lonely).venue!)[0]!.valid).toBe(false);
    expect(performance(lonely).rooms).toMatchObject({ rooms: 1, valid: 0 });
    expect(performance(lonely).layout.hints.get(1)).toContain('noBath');
    expect(performance(lonely).capacity).toBe(0);
    expect(performance(lonely).earningsPerHour).toBe(0);
    const far = furnish(city(), ['singleBed', 0, 3], ['toilet', 5, 5]);
    expect(roomsOf(inn(far).venue!)[0]!.valid).toBe(false);
    const near = furnish(city(), ['singleBed', 0, 3], ['toilet', 1, 3]);
    expect(roomsOf(inn(near).venue!)[0]!.valid).toBe(true);
  });

  it('lets a bathroom piece serve only so many rooms', () => {
    const state = furnish(city(), ['singleBed', 0, 2], ['singleBed', 2, 2], ['toilet', 1, 2]);
    expect(roomsOf(inn(state).venue!).filter(room => room.valid)).toHaveLength(1);
    const bath = furnish(upgraded(city()), ['singleBed', 0, 2], ['singleBed', 2, 2], ['bathtub', 0, 5]);
    expect(roomsOf(inn(bath).venue!).filter(room => room.valid)).toHaveLength(2);
  });

  it('sets the standing and the rate of a room from its extras', () => {
    const plain = roomsOf(inn(furnish(city(), ['singleBed', 0, 3], ['toilet', 1, 3])).venue!)[0]!;
    const comfy = roomsOf(inn(furnish(city(), ['singleBed', 0, 3], ['toilet', 1, 3], ['sofa', 2, 3], ['floorLamp', 2, 4], ['pottedPlant', 3, 3])).venue!)[0]!;
    const luxury = roomsOf(inn(furnish(upgraded(city()), ['singleBed', 0, 3], ['toilet', 1, 3], ['sofa', 2, 3], ['television', 3, 3], ['coffeeCorner', 2, 4], ['floorLamp', 3, 4])).venue!)[0]!;
    expect([plain.standing, comfy.standing, luxury.standing]).toEqual([1, 2, 3]);
    expect(comfy.rate).toBeGreaterThan(plain.rate);
    expect(luxury.rate).toBeGreaterThan(comfy.rate);
    expect(furnish(city(), ['doubleBed', 0, 3], ['toilet', 2, 3])).toBeDefined();
    const double = roomsOf(inn(furnish(city(), ['doubleBed', 0, 3], ['toilet', 2, 3])).venue!)[0]!;
    expect(double.rate).toBeGreaterThan(plain.rate);
  });

  it('draws guests from outside the city, by what the city offers and by its reputation', () => {
    const quiet = city();
    const lively = city([building(10, 'casino', 60, 50), building(11, 'marina', 62, 50), building(12, 'theater', 64, 50), building(13, 'park', 66, 50), building(14, 'stadium', 68, 50), building(15, 'concertHall', 70, 50)]);
    expect(cityAttractiveness(lively)).toBeGreaterThan(cityAttractiveness(quiet));
    const rooms = (state: GameState) => hire(furnish(state, ['receptionDesk', 3, 1], ['singleBed', 0, 3], ['toilet', 1, 3]), 'receptionist');
    expect(performance(rooms(lively)).visitors).toBeGreaterThan(performance(rooms(quiet)).visitors);
    const withReputation = (value: number): GameState => { const state = rooms(quiet); return { ...state, buildings: state.buildings.map(b => b.type === 'hotel' ? { ...b, venue: { ...b.venue!, reputation: value } } : b) }; };
    expect(performance(withReputation(100)).visitors).toBeGreaterThan(performance(withReputation(0)).visitors);
  });

  it('earns the rate of the rooms that guests fill, up to the rooms it has', () => {
    const state = basic();
    const result = performance(state);
    expect(result.rooms!.valid).toBe(1);
    expect(result.rooms!.occupied).toBeLessThanOrEqual(1);
    expect(result.earningsPerHour).toBeGreaterThan(0);
    expect(result.earningsPerHour).toBeLessThanOrEqual(roomsOf(inn(state).venue!)[0]!.rate * priceMultiplier(2) / HOTEL.stayHours * 1.1 + 1e-9);
    expect(result.served).toBeLessThanOrEqual(result.capacity);
  });

  it('checks guests in slower without a receptionist or a reception desk', () => {
    const desk = furnish(city(), ['singleBed', 0, 3], ['toilet', 1, 3], ['receptionDesk', 3, 1]);
    const noDesk = furnish(city(), ['singleBed', 0, 3], ['toilet', 1, 3]);
    expect(performance(hire(desk, 'receptionist')).accepted).toBeGreaterThan(performance(desk).accepted);
    expect(performance(desk).accepted).toBeGreaterThan(performance(noDesk).accepted);
  });

  it('lets a manager set the rate, which trades guests for revenue', () => {
    expect(failure(basic(), { type: 'SetVenuePrice', buildingId: 1, price: 4 })).toBe('error.managerRequired');
    const managed = hire(basic(), 'manager');
    const at = (price: number) => performance(send(managed, { type: 'SetVenuePrice', buildingId: 1, price }));
    expect(at(6).accepted).toBeLessThan(at(2).accepted);
    expect(priceMultiplier(6)).toBeGreaterThan(priceMultiplier(2));
  });

  it('needs housekeepers: unclean rooms lower the target reputation', () => {
    const rooms = [['receptionDesk', 3, 1], ['singleBed', 0, 3], ['toilet', 1, 3], ['singleBed', 2, 3], ['toilet', 3, 3], ['doubleBed', 4, 4]] as [FixtureId, number, number][];
    const state = hire(furnish(city(), ...rooms), 'receptionist');
    const dirty = performance(state);
    const clean = performance(hire(state, 'housekeeper', 2));
    expect(dirty.rooms!.cleanliness).toBeLessThan(1);
    expect(clean.rooms!.cleanliness).toBeGreaterThan(dirty.rooms!.cleanliness);
    expect(clean.reputationTarget!).toBeGreaterThan(dirty.reputationTarget!);
  });

  it('moves the reputation toward its target each hour, the same in one Catch-up or in steps', () => {
    const state = funded(hire(hire(basic(), 'housekeeper', 2), 'technician'));
    const target = performance(state).reputationTarget!;
    expect(target).not.toBe(HOTEL.reputationStart);
    const once = advance(state, 12 * H).state;
    let stepped = state;
    for (let hour = 1; hour <= 12; hour++) stepped = advance(stepped, hour * H).state;
    expect(reputationOf(inn(once).venue!)).toBeCloseTo(reputationOf(inn(stepped).venue!), 9);
    expect(reputationOf(inn(once).venue!)).not.toBe(HOTEL.reputationStart);
    expect(Math.sign(reputationOf(inn(once).venue!) - HOTEL.reputationStart)).toBe(Math.sign(target - HOTEL.reputationStart));
    expect(inn(once).venue!.takings).toBeCloseTo(inn(stepped).venue!.takings, 6);
  });

  it('falls when the hotel is shut, or when its Fixtures break down', () => {
    const dark: GameState = { ...basic(), buildings: basic().buildings.filter(b => b.type !== 'coalPlant') };
    expect(reputationOf(inn(advance(dark, 24 * H).state).venue!)).toBeLessThan(HOTEL.reputationStart);
    const broken: GameState = { ...basic(), buildings: basic().buildings.map(b => b.type === 'hotel' ? { ...b, venue: { ...b.venue!, fixtures: b.venue!.fixtures.map(f => f.type === 'toilet' ? { ...f, broken: true } : f) } } : b) };
    expect(performance(broken).rooms!.valid).toBe(0);
  });

  it('wears the beds, and lets a technician repair them at the expense of the Takings', () => {
    const plain = advance(funded(basic()), 6 * H).state;
    const bed = inn(plain).venue!.fixtures.find(f => f.type === 'singleBed')!;
    expect(bed.condition ?? 100).toBeLessThan(100);
    expect(bed.condition ?? 100).toBeGreaterThan(80);
    const tended = advance(funded(hire(basic(), 'technician')), 6 * H).state;
    expect(inn(tended).venue!.fixtures.find(f => f.type === 'singleBed')!.condition ?? 100).toBe(100);
  });

  it('counts its Staff as Jobs, saves its reputation and upgrades with Tiers', () => {
    expect(inn(basic()).venue!.staff).toEqual({ receptionist: 1 });
    const up = upgraded(city());
    expect(inn(up).tier).toBe(3);
    expect(failure(up, place('miniFridge', 5, 5))).toBeNull();
    expect(failure(city(), { type: 'HireStaff', buildingId: 1, role: 'security' })).toBe('error.unknownCommand');
    expect(failure(city(), { type: 'HireStaff', buildingId: 1, role: 'cashier' })).toBe('error.unknownCommand');
  });
});
