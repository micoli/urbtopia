import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type StaffRole } from '../index';
import { GOOD_ENTRIES } from '../economy/items';
import { INGREDIENTS, INGREDIENT_FAMILIES, RESTAURANT, dishPrice, frontCellOf, menuOf, menuSlotsOf, seatingOf, varietyOf } from './restaurant';
import { FIXTURES, fixtureIdsInCategory } from './fixtures';
import { venueBoundaries, venuePerformance } from './venues';

const H = 3_600_000;
import { commuteRoad } from './commuteRoad';
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (storage: GameState['storage'] = { materials: { milk: 100, henEgg: 100 }, goods: { bread: 100, cannedFish: 100 } }, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'restaurant', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, roads: commuteRoad, lastSeen: 0, storage,
  buildings: [building(1, 'restaurant', 55, 50), building(2, 'home', 52, 50, { tier: 4 }), building(3, 'coalPlant', 90, 40, { tier: 4 })],
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
const restaurant = (state: GameState) => state.buildings.find(candidate => candidate.type === 'restaurant')!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture, x, y, rotation });
const hire = (state: GameState, role: StaffRole, count = 1): GameState => ({
  ...state,
  buildings: state.buildings.map(candidate => (candidate.id === 1 && candidate.venue ? { ...candidate, venue: { ...candidate.venue, staff: { ...candidate.venue.staff, [role]: (candidate.venue.staff?.[role] ?? 0) + count } } } : candidate)),
});
const performance = (state: GameState) => venuePerformance(state, restaurant(state) as never);
// A kitchen, two tables with four chairs each, a checkout; the cook, a waiter and the maître d' at work.
const TABLE_ONE = [[3, 1, 0], [2, 2, 3], [4, 2, 1], [3, 3, 2]] as const;
const TABLE_TWO = [[3, 4, 0], [2, 5, 3], [4, 5, 1], [3, 6, 2]] as const;
const fitted = (state = city()) => {
  const placed = [
    place('cooktop', 1, 3), place('restaurantTable', 3, 2), place('restaurantTable', 3, 5),
    ...[...TABLE_ONE, ...TABLE_TWO].map(([x, y, rotation]) => place('restaurantChair', x, y, rotation)),
    place('restaurantCheckout', 6, 1),
  ];
  return hire(hire(hire(placed.reduce(send, state), 'cook'), 'waiter'), 'maitreD');
};
const withMenu = (state: GameState, menu: string[]) => send(state, { type: 'SetMenu', buildingId: 1, menu: menu as never });

describe('Restaurant Venue', () => {
  it('is a Venue of its own with its own Fixtures and Staff', () => {
    expect(restaurant(city()).venue).toEqual({ fixtures: [], nextFixtureId: 1, takings: 0 });
    expect(failure(city(), place('counter', 1, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('restaurantTable', 1, 1))).toBeNull();
    expect(fixtureIdsInCategory('restaurant', 'kitchen')).toEqual(['cooktop', 'prepTable']);
  });

  it('sets its posts by Tier', () => {
    const posts = (tier: number, role: StaffRole) => {
      const state = { ...city(), buildings: city().buildings.map(candidate => (candidate.id === 1 ? { ...candidate, tier } : candidate)) };
      let hired = state;
      let count = 0;
      while (dispatch(hired, { type: 'HireStaff', buildingId: 1, role }, 0).ok) {
        hired = send(hired, { type: 'HireStaff', buildingId: 1, role });
        count++;
      }
      return count;
    };
    expect([1, 2, 3].map(tier => posts(tier, 'kitchenAssistant'))).toEqual([1, 2, 3]);
    expect([1, 2, 3].map(tier => posts(tier, 'waiter'))).toEqual([1, 2, 4]);
    expect([1, 2, 3].map(tier => posts(tier, 'cook'))).toEqual([1, 1, 1]);
  });
});

describe('Seating', () => {
  it('counts a chair only when it faces a table', () => {
    const state = fitted();
    const fixtures = restaurant(state).venue!.fixtures;
    const chairs = fixtures.filter(fixture => fixture.type === 'restaurantChair');
    const seating = seatingOf(restaurant(state).venue!);
    expect(chairs).toHaveLength(8);
    expect(seating.tableSeats).toBe(8);
  });

  it('turns the facing with the rotation', () => {
    expect(frontCellOf({ x: 4, y: 4, rotation: 0 })).toEqual({ x: 4, y: 5 });
    expect(frontCellOf({ x: 4, y: 4, rotation: 1 })).toEqual({ x: 3, y: 4 });
    expect(frontCellOf({ x: 4, y: 4, rotation: 2 })).toEqual({ x: 4, y: 3 });
    expect(frontCellOf({ x: 4, y: 4, rotation: 3 })).toEqual({ x: 5, y: 4 });
  });

  it('leaves a chair turned away from the table unseated', () => {
    const state = [place('restaurantTable', 4, 3), place('restaurantChair', 4, 2, 2)].reduce(send, city());
    const seating = seatingOf(restaurant(state).venue!);
    expect(seating.tableSeats).toBe(0);
    expect(seating.unseated).toHaveLength(1);
    expect(performance(state).layout.hints.get(seating.unseated[0]!)).toContain('noHost');
  });

  it('serves at most three stools per bar', () => {
    const stools = [place('restaurantBar', 2, 2), ...[[2, 1, 0], [1, 2, 3], [3, 2, 1], [2, 3, 2]].map(([x, y, rotation]) => place('restaurantStool', x!, y!, rotation as Rotation))].reduce(send, city());
    expect(seatingOf(restaurant(stools).venue!).barSeats).toBe(3);
  });
});

describe('Menu', () => {
  it('serves only edible Goods and Materials', () => {
    expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: ['planks'] })).toBe('error.unknownCommand');
    expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: ['milk', 'milk'] })).toBe('error.unknownCommand');
    expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: ['flour'] })).toBe('error.unknownCommand');
    expect(restaurant(withMenu(fitted(), ['milk', 'bread'])).venue!.menu).toEqual(['milk', 'bread']);
  });

  it('is limited by the slots of the Tier', () => {
    expect([1, 2, 3].map(menuSlotsOf)).toEqual([3, 5, 8]);
    expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: ['milk', 'bread', 'henEgg', 'cannedFish'] })).toBe('error.menuFull');
  });

  it('knows a family for every food Good', () => {
    const food = GOOD_ENTRIES.filter(({ category }) => category === 'food').map(({ id }) => id);
    expect(food.filter(id => !INGREDIENTS.includes(id))).toEqual([]);
    expect(new Set(INGREDIENTS).size).toBe(INGREDIENTS.length);
    expect(Object.keys(INGREDIENT_FAMILIES)).toHaveLength(8);
  });

  it('offers the vegetables, the fruits and the grains that grow on the farms, and no flour', () => {
    for (const item of ['tomato', 'carrot', 'lettuce', 'pumpkin', 'apple', 'orange', 'watermelon']) {
      expect(INGREDIENTS, item).toContain(item);
      expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: [item as never] })).toBeNull();
    }
    expect(INGREDIENTS).not.toContain('flour');
    for (const grain of ['wheat', 'rice']) expect(failure(fitted(), { type: 'SetMenu', buildingId: 1, menu: [grain as never] })).toBeNull();
  });

  it('drops a saved Menu item that is no longer served', () => {
    const saved = restaurant(withMenu(fitted(), ['milk', 'bread'])).venue!;
    expect(menuOf({ ...saved, menu: ['flour', 'milk'] as never })).toEqual(['milk']);
  });

  it('pleases more Diners the more families it mixes, up to a cap', () => {
    expect(varietyOf(['milk', 'cream'])).toBe(0);
    expect(varietyOf(['milk', 'bread'])).toBeCloseTo(RESTAURANT.varietyPerFamily);
    expect(varietyOf(['milk', 'bread', 'fish', 'henEgg', 'honey'])).toBe(RESTAURANT.maxVariety);
  });
});

describe('Restaurant economy', () => {
  it('serves nobody with an empty Menu or an empty Storehouse', () => {
    expect(performance(fitted()).served).toBe(0);
    expect(performance(withMenu(fitted(city({ materials: {}, goods: {} })), ['milk'])).served).toBe(0);
  });

  it('earns from a Menu once the kitchen, a table and a checkout work', () => {
    const state = withMenu(fitted(), ['milk', 'bread']);
    expect(performance(state).visitors).toBeGreaterThan(0);
    expect(performance(state).served).toBeGreaterThan(0);
    expect(performance(state).grossPerHour).toBeGreaterThan(0);
  });

  it('prices a dish from the value of its ingredient, cooked and served', () => {
    expect(dishPrice('cannedFish', 2)).toBeGreaterThan(dishPrice('milk', 2));
    expect(dishPrice('milk', 2)).toBeCloseTo(4 * (1 + RESTAURANT.markupPerStep * 2) * RESTAURANT.dishFactor);
  });

  it('works slower without its cook, its waiter or its maître d', () => {
    const base = withMenu(fitted(), ['milk', 'bread']);
    const stripped = (role: StaffRole) => ({
      ...base,
      buildings: base.buildings.map(candidate => (candidate.id === 1 && candidate.venue ? { ...candidate, venue: { ...candidate.venue, staff: { ...candidate.venue.staff, [role]: 0 } } } : candidate)),
    });
    expect(performance(stripped('cook')).capacity).toBeLessThan(performance(base).capacity);
    expect(performance(stripped('maitreD')).accepted).toBeLessThan(performance(base).accepted);
    expect(performance(stripped('waiter')).capacity).toBeLessThan(performance(base).capacity);
  });

  it('speeds a cooktop up with a prep table beside it', () => {
    const state = withMenu(fitted(), ['milk']);
    const prepared = send(state, place('prepTable', 1, 4));
    expect(performance(prepared).capacity).toBeGreaterThanOrEqual(performance(state).capacity);
  });

  it('wins back the rush with waiting armchairs', () => {
    const state = withMenu(fitted(), ['milk', 'bread']);
    const seated = [place('waitingArmchair', 6, 6), place('waitingArmchair', 7, 6)].reduce(send, state);
    expect(performance(seated).capacity).toBeGreaterThan(performance(state).capacity);
  });

  it('sells drinks from the bar without any ingredient', () => {
    const state = withMenu([place('restaurantBar', 6, 3), place('restaurantStool', 6, 2, 0), place('restaurantStool', 7, 3, 1)].reduce(send, fitted()), ['milk']);
    expect(performance(hire(state, 'bartender')).grossPerHour).toBeGreaterThan(performance(withMenu(fitted(), ['milk'])).grossPerHour);
  });
});

describe('Ingredients from the Storehouse', () => {
  it('eats Goods and Materials while it serves', () => {
    const state = withMenu(fitted(), ['milk', 'bread']);
    const later = advance(state, H).state;
    expect(later.storage.materials.milk).toBeLessThan(100);
    expect(later.storage.goods.bread).toBeLessThan(100);
    expect(later.storage.goods.cannedFish).toBe(100);
  });

  it('takes whole units only from the Storehouse, and keeps the fraction in the Restaurant', () => {
    const later = advance(withMenu(fitted(), ['milk', 'bread']), 1.7 * H).state;
    expect(Number.isInteger(later.storage.materials.milk)).toBe(true);
    expect(Number.isInteger(later.storage.goods.bread)).toBe(true);
    const eaten = Object.values(restaurant(later).venue!.eaten ?? {});
    expect(eaten.length).toBeGreaterThan(0);
    expect(eaten.every(fraction => fraction >= 0 && fraction < 1)).toBe(true);
  });

  it('plans a boundary when an ingredient runs out, and stops serving it', () => {
    const state = withMenu(fitted(city({ materials: { milk: 3 }, goods: { bread: 1000 } })), ['milk', 'bread']);
    const [next] = venueBoundaries(state, 0).sort((a, b) => a - b);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10 * H);
    const later = advance(state, 24 * H).state;
    expect(later.storage.materials.milk ?? 0).toBeLessThan(1);
  });

  it('gives the same result in one long Catch-up as in many short ones', () => {
    const state = withMenu(fitted(city({ materials: { milk: 3 }, goods: { bread: 1000 } })), ['milk', 'bread']);
    const once = advance(state, 12 * H).state;
    const stepped = Array.from({ length: 12 }, (_, hour) => hour + 1).reduce((current, hour) => advance(current, hour * H).state, state);
    expect(stepped.storage.materials.milk ?? 0).toBeCloseTo(once.storage.materials.milk ?? 0, 3);
    expect(stepped.storage.goods.bread ?? 0).toBeCloseTo(once.storage.goods.bread ?? 0, 3);
    expect(restaurant(stepped).venue!.takings).toBeCloseTo(restaurant(once).venue!.takings, 3);
  });
});

describe('Restaurant Fixtures', () => {
  it('model every Fixture the Restaurant uses', () => {
    const ids = Object.entries(FIXTURES).filter(([, spec]) => spec.venue === 'restaurant');
    expect(ids).toHaveLength(10);
    expect(ids.every(([, spec]) => spec.model.length > 0)).toBe(true);
  });
});
