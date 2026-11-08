import { isGood, valueOf, type ItemId } from '../economy/items';
import { FIXTURES } from './fixtures';
import { tilesOf, type LayoutHint } from './layout';
import { clamp01, emptyLayout, serviceRatio, type Evaluate } from './rules';
import { frontRate, hiredOf, presenceOf } from './staff';
import { neighbourhoodVisitors, priceAcceptance } from './shared';
import { venueTierOf } from './profiles';
import type { Rotation, Storage, VenueData, VenueFixture } from '../engine/state';

export const RESTAURANT = {
  visitsPerCitizen: 0.2,
  // What cooking and service add to the value of the ingredient a Diner eats.
  dishFactor: 3,
  markupPerStep: 0.1,
  turnsPerHour: 1.5,
  withoutCookRate: 0.3,
  assistantBoost: 0.25,
  prepBonus: 0.25,
  prepReach: 2,
  waiterCovers: 8,
  withoutWaiterCovers: 3,
  withoutBartenderRate: 0.3,
  drinkShare: 0.3,
  stoolDrinks: 2,
  drinkPrice: 3,
  // Share of the capacity lost to the rush when nobody can wait; the armchairs win it back.
  rushLoss: 0.15,
  waitingNeeded: 4,
  varietyPerFamily: 0.05,
  maxVariety: 0.15,
  stockEpsilon: 1e-6,
};

// The edible Goods and Materials a Restaurant can serve, by family. A Menu mixes families to please more Diners.
export const INGREDIENT_FAMILIES = {
  dairy: ['milk', 'goatMilk', 'cheese', 'goatCheese', 'cream'],
  bakery: ['flour', 'bread', 'fougasse', 'appleCake', 'cherryClafoutis'],
  sea: ['fish', 'cannedFish'],
  farm: ['henEgg', 'duckEgg'],
  orchard: ['cherry', 'olive', 'oliveOil'],
  sweet: ['honey'],
} as const satisfies Record<string, readonly ItemId[]>;

export type IngredientFamily = keyof typeof INGREDIENT_FAMILIES;

export const INGREDIENTS: readonly ItemId[] = Object.values(INGREDIENT_FAMILIES).flat();

const FAMILY_OF = new Map<string, IngredientFamily>(
  (Object.entries(INGREDIENT_FAMILIES) as [IngredientFamily, readonly string[]][]).flatMap(([family, items]) => items.map((item): [string, IngredientFamily] => [item, family])),
);

export const isIngredient = (item: string): item is ItemId => FAMILY_OF.has(item);

export const familyOf = (item: ItemId): IngredientFamily => FAMILY_OF.get(item)!;

export const menuSlotsOf = (tier: number): number => venueTierOf('restaurant', tier).menuSlots!;

export const menuOf = (venue: VenueData): readonly ItemId[] => venue.menu ?? [];

export const stockOfIngredient = (storage: Storage, item: ItemId): number => Math.floor((isGood(item) ? storage.goods[item] : storage.materials[item]) ?? 0);

export const markupOf = (price: number): number => RESTAURANT.markupPerStep * price;

// A Diner eats one unit of an ingredient: the dish is worth that ingredient, cooked and served.
export const dishPrice = (item: ItemId, price: number): number => valueOf(item) * (1 + markupOf(price)) * RESTAURANT.dishFactor;

// The Menu ingredients the Storehouse still holds.
export const servedIngredients = (storage: Storage, venue: VenueData): ItemId[] => menuOf(venue).filter(item => stockOfIngredient(storage, item) >= 1);

export const varietyOf = (items: readonly ItemId[]): number => Math.min(RESTAURANT.maxVariety, RESTAURANT.varietyPerFamily * Math.max(0, new Set(items.map(familyOf)).size - 1));

// What a seat faces after its rotation: a Fixture turned by `rotation` looks toward this cell offset.
const FRONT: readonly { x: number; y: number }[] = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }];

export const frontCellOf = (seat: Pick<VenueFixture, 'x' | 'y' | 'rotation'>): { x: number; y: number } => {
  const front = FRONT[seat.rotation as Rotation]!;
  return { x: seat.x + front.x, y: seat.y + front.y };
};

export interface Seating {
  // Seats that face a table (or the bar) with room left.
  seated: ReadonlySet<number>;
  tableSeats: number;
  barSeats: number;
  unseated: readonly number[];
}

// A chair counts when the cell it faces holds a table that has seats left; a stool, when it faces the bar.
export function seatingOf(venue: VenueData): Seating {
  const seats = venue.fixtures.filter(fixture => FIXTURES[fixture.type].seat !== undefined).sort((a, b) => a.id - b.id);
  const load = new Map<number, number>();
  const seated = new Set<number>();
  const unseated: number[] = [];
  let tableSeats = 0;
  let barSeats = 0;
  for (const seat of seats) {
    const kind = FIXTURES[seat.type].seat!;
    const target = frontCellOf(seat);
    const host = venue.fixtures.find(candidate => {
      const spec = FIXTURES[candidate.type];
      const room = kind === 'table' ? spec.seats : spec.stools;
      return room !== undefined && (load.get(candidate.id) ?? 0) < room && tilesOf(candidate).some(tile => tile.x === target.x && tile.y === target.y);
    });
    if (!host) {
      unseated.push(seat.id);
      continue;
    }
    load.set(host.id, (load.get(host.id) ?? 0) + 1);
    seated.add(seat.id);
    if (kind === 'table') tableSeats++;
    else barSeats++;
  }
  return { seated, tableSeats, barSeats, unseated };
}

const sum = (fixtures: readonly VenueFixture[], read: (fixture: VenueFixture) => number | undefined): number => fixtures.reduce((total, fixture) => total + (read(fixture) ?? 0), 0);

export const evaluateRestaurant: Evaluate = (state, venue, { working, price, surge }) => {
  const fixtures = working.fixtures;
  const seating = seatingOf(working);
  const servedItems = servedIngredients(state.storage, venue.venue);
  const variety = varietyOf(servedItems);
  const visitors = neighbourhoodVisitors(state, venue, RESTAURANT.visitsPerCitizen);
  const accepted = visitors * priceAcceptance(price) * frontRate(venue.venue, 'restaurant') * (1 + variety) * surge;

  const cooktops = fixtures.filter(fixture => FIXTURES[fixture.type].cook !== undefined);
  const preps = fixtures.filter(fixture => FIXTURES[fixture.type].prep);
  const cookRate = (presenceOf(venue.venue, 'cook') + (1 - presenceOf(venue.venue, 'cook')) * RESTAURANT.withoutCookRate) * (1 + RESTAURANT.assistantBoost * hiredOf(venue.venue, 'kitchenAssistant'));
  const hasPrep = (cooktop: VenueFixture): boolean => preps.some(prep => withinReach(cooktop, prep));
  const kitchen = cooktops.reduce((total, cooktop) => total + FIXTURES[cooktop.type].cook! * (hasPrep(cooktop) ? 1 + RESTAURANT.prepBonus : 1), 0) * cookRate;
  const waiters = hiredOf(venue.venue, 'waiter');
  const service = waiters > 0 ? waiters * RESTAURANT.waiterCovers : RESTAURANT.withoutWaiterCovers;
  const checkouts = fixtures.filter(fixture => FIXTURES[fixture.type].checkout !== undefined);
  const checkout = sum(checkouts, fixture => FIXTURES[fixture.type].checkout);
  const waitingPlaces = sum(fixtures, fixture => FIXTURES[fixture.type].waiting);
  const rush = RESTAURANT.rushLoss * (1 - Math.min(1, waitingPlaces / RESTAURANT.waitingNeeded));
  const capacity = Math.min(kitchen, service, seating.tableSeats * RESTAURANT.turnsPerHour, checkout) * (1 - rush);
  const served = servedItems.length > 0 ? Math.min(accepted, capacity) : 0;

  const bars = fixtures.filter(fixture => FIXTURES[fixture.type].drinks !== undefined);
  const barRate = presenceOf(venue.venue, 'bartender') + (1 - presenceOf(venue.venue, 'bartender')) * RESTAURANT.withoutBartenderRate;
  const barCapacity = sum(bars, fixture => FIXTURES[fixture.type].drinks) * barRate;
  const drinks = Math.min(barCapacity, served * RESTAURANT.drinkShare + seating.barSeats * RESTAURANT.stoolDrinks);

  const perCover = servedItems.length > 0 ? servedItems.reduce((total, item) => total + dishPrice(item, price), 0) / servedItems.length : 0;
  const dishes = served * perCover;
  const drinkRevenue = drinks * RESTAURANT.drinkPrice * (1 + markupOf(price));

  const tables = fixtures.filter(fixture => FIXTURES[fixture.type].seats !== undefined);
  const earnings = new Map<number, number>();
  for (const table of tables) earnings.set(table.id, dishes / tables.length);
  for (const bar of bars) earnings.set(bar.id, drinkRevenue / bars.length);

  const usage = new Map<number, number>();
  const spread = (list: readonly VenueFixture[], amount: number) => list.forEach(fixture => usage.set(fixture.id, amount / list.length));
  spread(cooktops, served);
  spread(preps, served);
  spread(tables, served);
  spread(checkouts, served);
  spread(bars, drinks);
  const seats = fixtures.filter(fixture => seating.seated.has(fixture.id));
  spread(seats, served + drinks);

  const consumption = new Map<ItemId, number>(servedItems.map(item => [item, served / servedItems.length]));
  const hints = new Map<number, readonly LayoutHint[]>(seating.unseated.map(id => [id, ['noHost']]));
  const availability = menuOf(venue.venue).length > 0 ? servedItems.length / menuOf(venue.venue).length : 0;
  const satisfaction = clamp01(0.35 * serviceRatio(accepted, capacity) + 0.25 * Math.min(1, new Set(servedItems.map(familyOf)).size / 3) + 0.2 * availability + 0.2 * priceAcceptance(price));
  return {
    visitors,
    accepted,
    capacity,
    served,
    gross: dishes + drinkRevenue,
    earnings,
    usage,
    layout: { ...emptyLayout(1 + variety), seatedIds: seating.seated, hints },
    satisfaction,
    sales: new Map(),
    consumption,
  };
};

const withinReach = (a: VenueFixture, b: VenueFixture): boolean => tilesOf(a).some(first => tilesOf(b).some(second => Math.abs(first.x - second.x) + Math.abs(first.y - second.y) <= RESTAURANT.prepReach));

export type Eaten = Partial<Record<ItemId, number>>;

const WHOLE_EPSILON = 1e-9;

// The Storehouse holds whole units: what the Diners eat adds up in `eaten` and leaves the Storehouse a unit at a time.
export function consumeIngredients(storage: Storage, eaten: Eaten, consumption: ReadonlyMap<ItemId, number>, hours: number): { storage: Storage; eaten: Eaten } {
  let goods = storage.goods;
  let materials = storage.materials;
  const next: Eaten = { ...eaten };
  for (const [item, rate] of consumption) {
    const total = (next[item] ?? 0) + rate * hours;
    if (total <= 0) continue;
    const whole = Math.floor(total + WHOLE_EPSILON);
    const held = (isGood(item) ? goods[item] : materials[item]) ?? 0;
    const taken = Math.min(whole, held);
    if (taken > 0) {
      if (isGood(item)) goods = { ...goods, [item]: held - taken };
      else materials = { ...materials, [item]: held - taken };
    }
    const left = Math.max(0, total - whole);
    if (left > WHOLE_EPSILON) next[item] = left;
    else delete next[item];
  }
  return { storage: goods === storage.goods && materials === storage.materials ? storage : { goods, materials }, eaten: next };
}

// Times, after `from`, at which an ingredient of the Menu runs out at the current rate.
export function nextIngredientOut(storage: Storage, eaten: Eaten, consumption: ReadonlyMap<ItemId, number>, from: number, hourMs: number): number[] {
  return [...consumption].flatMap(([item, rate]) => {
    if (rate <= 0) return [];
    const held = (isGood(item) ? storage.goods[item] : storage.materials[item]) ?? 0;
    const at = from + Math.max(0, held - (eaten[item] ?? 0)) / rate * hourMs;
    return at > from ? [at] : [];
  });
}
