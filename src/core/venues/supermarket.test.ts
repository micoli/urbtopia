import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type StaffRole } from '../index';
import { GOODS } from '../economy/items';
import { SUPERMARKET, VENUE_PROFILES, hasStock, markupOf, restockFee, stockOf, takingsCapOf, unitPrice, venueBoundaries, venuePerformance } from './venues';

const H = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const market = (goods: GameState['storage']['goods'] = { planks: 100, bricks: 100 }, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'market', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  storage: { materials: {}, goods },
  buildings: [building(1, 'supermarket', 55, 50), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })],
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
const store = (state: GameState) => state.buildings.find(b => b.type === 'supermarket')!;
const place = (fixture: FixtureId, x: number, y: number): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture, x, y });
// Staff set straight in the state: the tests of the rules are not about the hiring conditions, which have their own tests.
const hire = (state: GameState, role: StaffRole, count = 1): GameState => ({
  ...state,
  buildings: state.buildings.map(candidate => (candidate.id === 1 && candidate.venue ? { ...candidate, venue: { ...candidate.venue, staff: { ...candidate.venue.staff, [role]: (candidate.venue.staff?.[role] ?? 0) + count } } } : candidate)),
});
const performance = (state: GameState) => venuePerformance(state, store(state) as never);
const shelfOf = (state: GameState, index = 0) => store(state).venue!.fixtures.filter(f => f.type.startsWith('shelf') || f.type.startsWith('display') || f.type === 'freezer')[index]!;
const fitted = (state = market()) => {
  const placed = [place('checkout', 3, 1), place('shelfBags', 1, 2), place('shelfBoxes', 2, 2)].reduce(send, state);
  return hire(placed, 'cashier', 2);
};
const stocked = (state = fitted()) => {
  const first = send(state, { type: 'StockShelf', buildingId: 1, fixtureId: shelfOf(state, 0).id, good: 'planks' });
  return send(first, { type: 'StockShelf', buildingId: 1, fixtureId: shelfOf(first, 1).id, good: 'bricks' });
};

describe('Supermarket Venue', () => {
  it('is a Venue of its own, starting empty', () => {
    expect(store(market()).venue).toEqual({ fixtures: [], nextFixtureId: 1, takings: 0 });
    expect(failure(market(), place('counter', 1, 1))).toBe('error.unknownCommand');
    expect(failure(market(), place('doubleBed', 1, 1))).toBe('error.unknownCommand');
  });

  it('draws shoppers from the Homes within reach only', () => {
    expect(performance(fitted()).visitors).toBeGreaterThan(0);
    const far: GameState = { ...fitted(), buildings: fitted().buildings.map(b => b.type === 'home' ? { ...b, x: 140 } : b) };
    expect(performance(far).visitors).toBe(0);
  });

  it('earns nothing from a shelf that holds nothing', () => {
    const state = fitted();
    expect(performance(state).earningsPerHour).toBe(0);
    expect(performance(state).layout.hints.get(shelfOf(state).id)).toContain('emptyShelf');
  });

  it('stocks a shelf from the Storehouse for a handling fee', () => {
    const state = fitted();
    const shelf = shelfOf(state);
    const filled = send(state, { type: 'StockShelf', buildingId: 1, fixtureId: shelf.id, good: 'planks' });
    expect(stockOf(shelfOf(filled))).toBe(12);
    expect(shelfOf(filled).good).toBe('planks');
    expect(filled.storage.goods.planks).toBe(88);
    expect(filled.urbs).toBe(state.urbs - restockFee('planks', 12));
    expect(restockFee('planks', 12)).toBe(Math.ceil(12 * GOODS.planks.value * SUPERMARKET.restockFee));
    expect(hasStock(shelfOf(filled))).toBe(true);
  });

  it('refuses a shelf with another Good, a full shelf, missing Goods and a missing fee', () => {
    const filled = stocked();
    const first = shelfOf(filled, 0);
    expect(failure(filled, { type: 'StockShelf', buildingId: 1, fixtureId: first.id, good: 'bricks' })).toBe('error.shelfBusy');
    expect(failure(filled, { type: 'StockShelf', buildingId: 1, fixtureId: first.id, good: 'planks' })).toBe('error.shelfFull');
    expect(failure(fitted(market({})), { type: 'StockShelf', buildingId: 1, fixtureId: shelfOf(fitted(market({}))).id, good: 'planks' })).toBe('error.missingGoods');
    expect(failure({ ...fitted(), urbs: 0 }, { type: 'StockShelf', buildingId: 1, fixtureId: shelfOf(fitted()).id, good: 'planks' })).toBe('error.notEnoughUrbs');
    expect(failure(fitted(), { type: 'StockShelf', buildingId: 1, fixtureId: 999, good: 'planks' })).toBe('error.unknownFixture');
  });

  it('only sells with a checkout, and caps the shoppers served by its capacity', () => {
    const noCheckout = hire([place('shelfBags', 1, 2)].reduce(send, market()), 'cashier', 2);
    const filled = send(noCheckout, { type: 'StockShelf', buildingId: 1, fixtureId: shelfOf(noCheckout).id, good: 'planks' });
    expect(performance(filled).capacity).toBe(0);
    expect(performance(filled).earningsPerHour).toBe(0);
    const open = performance(stocked());
    expect(open.capacity).toBe(20);
    expect(open.served).toBeLessThanOrEqual(open.capacity);
    expect(open.earningsPerHour).toBeGreaterThan(0);
    const slower = performance(hire([place('checkout', 3, 1), place('shelfBags', 1, 2)].reduce(send, market()), 'cashier', 1));
    expect(slower.capacity).toBeCloseTo(20 * 0.7, 9);
  });

  it('sells at the value of the Good plus the markup, split between the stocked shelves', () => {
    const state = stocked();
    const result = performance(state);
    const sold = [...result.salesByFixture.values()].reduce((sum, units) => sum + units, 0);
    expect(sold).toBeCloseTo(result.served * SUPERMARKET.basket, 9);
    expect(result.salesByFixture.size).toBe(2);
    const expected = [...result.salesByFixture.entries()].reduce((sum, [id, units]) => sum + units * unitPrice(state.buildings[0]!.venue!.fixtures.find(f => f.id === id)!.good!, 2), 0);
    expect(result.grossPerHour).toBeCloseTo(expected, 9);
    expect(unitPrice('planks', 2)).toBeCloseTo(GOODS.planks.value * (1 + markupOf(2)), 9);
  });

  it('empties the shelves as it sells, to the unit, at the hour of the last sale', () => {
    const state = stocked();
    const boundaries = venueBoundaries(state, 0);
    expect(boundaries.length).toBeGreaterThan(0);
    expect(Math.min(...boundaries)).toBeGreaterThan(0);
    const later = advance(state, 200 * H).state;
    for (const shelf of store(later).venue!.fixtures.filter(f => f.good)) expect(stockOf(shelf)).toBe(0);
    expect(store(later).venue!.takings).toBeGreaterThan(0);
    expect(performance(later).earningsPerHour).toBe(0);
  });

  it('gives the same Takings in one Catch-up or in steps, stock-outs included', () => {
    const state = stocked();
    const once = advance(state, 30 * H).state;
    let stepped = state;
    for (let hour = 1; hour <= 30; hour++) stepped = advance(stepped, hour * H).state;
    expect(store(stepped).venue!.takings).toBeCloseTo(store(once).venue!.takings, 6);
    expect(store(stepped).venue!.fixtures.map(stockOf)).toEqual(store(once).venue!.fixtures.map(stockOf));
  });

  it('lets a stocker refill a shelf each hour from the Storehouse, paying from the Takings', () => {
    const state = hire(stocked(), 'stocker');
    const drained: GameState = { ...state, buildings: state.buildings.map(b => b.type === 'supermarket' ? { ...b, venue: { ...b.venue!, takings: 50, fixtures: b.venue!.fixtures.map(f => f.good ? { ...f, stock: 2 } : f) } } : b) };
    const before = drained.storage.goods.planks ?? 0;
    const later = advance(drained, 1 * H).state;
    expect(stockOf(shelfOf(later, 0)) + stockOf(shelfOf(later, 1))).toBeGreaterThan(4 - 2 * 1.5);
    const taken = (before - (later.storage.goods.planks ?? 0)) + ((drained.storage.goods.bricks ?? 0) - (later.storage.goods.bricks ?? 0));
    expect(taken).toBeGreaterThan(0);
    expect(taken).toBeLessThanOrEqual(SUPERMARKET.stockerUnitsPerHour * 1);
  });

  it('needs a manager for the markup, which trades Visitors for margin', () => {
    expect(failure(stocked(), { type: 'SetVenuePrice', buildingId: 1, price: 4 })).toBe('error.managerRequired');
    const managed = hire(stocked(), 'manager');
    const at = (price: number) => performance(send(managed, { type: 'SetVenuePrice', buildingId: 1, price }));
    expect(at(6).accepted).toBeLessThan(at(2).accepted);
    expect(unitPrice('planks', 6)).toBeGreaterThan(unitPrice('planks', 2));
  });

  it('stops selling from a broken shelf, and wears the checkout slowly', () => {
    const state = stocked();
    const broken: GameState = { ...state, buildings: state.buildings.map(b => b.type === 'supermarket' ? { ...b, venue: { ...b.venue!, fixtures: b.venue!.fixtures.map(f => f.type === 'shelfBags' ? { ...f, broken: true } : f) } } : b) };
    expect(performance(broken).salesByFixture.size).toBe(1);
    const worn = advance(state, 2 * H).state;
    const checkout = store(worn).venue!.fixtures.find(f => f.type === 'checkout')!;
    expect(checkout.condition ?? 100).toBeGreaterThan(90);
  });

  it('is shed after the others when power is short, and closes when the wages cannot be paid', () => {
    const dark: GameState = { ...stocked(), buildings: stocked().buildings.filter(b => b.type !== 'coalPlant') };
    expect(performance(dark).powered).toBe(false);
    const empty = advance({ ...hire(hire(fitted(), 'manager'), 'stocker'), lastSeen: 0 }, 48 * H).state;
    expect(performance(empty).closed).toBe(true);
  });

  it('upgrades for Urbs and offers more Fixtures, posts and Takings', () => {
    const state = stocked();
    const upgraded = send(state, { type: 'UpgradeBuilding', buildingId: 1 });
    const earned = { ...upgraded, buildings: upgraded.buildings.map(b => (b.type === 'supermarket' ? { ...b, venue: { ...b.venue!, earned: VENUE_PROFILES.supermarket.rankAt[0] } } : b)) };
    expect(store(upgraded).tier).toBe(2);
    expect(takingsCapOf(2)).toBeGreaterThan(takingsCapOf(1));
    expect(failure(state, place('freezer', 5, 5))).toBe('error.tierTooLow');
    expect(failure(upgraded, place('freezer', 5, 5))).toBe('error.rankTooLow');
    expect(failure(earned, place('freezer', 5, 5))).toBeNull();
  });
});
