import { GOODS, type GoodId } from '../economy/items';
import { FIXTURES } from './fixtures';
import { clamp01, emptyLayout, serviceRatio, type Evaluate } from './rules';
import { frontRate, securityRate } from './staff';
import { neighbourhoodVisitors, priceAcceptance } from './shared';
import type { LayoutHint } from './layout';
import type { Storage, VenueFixture } from '../engine/state';

export const SUPERMARKET = {
  visitsPerCitizen: 0.3,
  basket: 3,
  markupPerStep: 0.1,
  restockFee: 0.1,
  stockerUnitsPerHour: 8,
  maxDecor: 0.15,
  stockEpsilon: 1e-6,
};

export const markupOf = (price: number): number => SUPERMARKET.markupPerStep * price;

export const isShelf = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].shelf !== undefined;

export const stockOf = (fixture: VenueFixture): number => fixture.stock ?? 0;

export const hasStock = (fixture: VenueFixture): boolean => isShelf(fixture) && fixture.good !== undefined && stockOf(fixture) > SUPERMARKET.stockEpsilon;

export const unitPrice = (good: GoodId, price: number): number => GOODS[good].value * (1 + markupOf(price));

export const evaluateSupermarket: Evaluate = (state, venue, { working, price, surge }) => {
  const decor = Math.min(SUPERMARKET.maxDecor, working.fixtures.reduce((total, fixture) => total + (FIXTURES[fixture.type].attract ?? 0), 0));
  const attractiveness = 1 + decor;
  const visitors = neighbourhoodVisitors(state, venue, SUPERMARKET.visitsPerCitizen);
  const accepted = visitors * priceAcceptance(price) * attractiveness * securityRate(venue.venue, 'supermarket') * surge;
  const checkouts = working.fixtures.filter(fixture => FIXTURES[fixture.type].checkout !== undefined);
  const capacity = checkouts.reduce((total, fixture) => total + FIXTURES[fixture.type].checkout!, 0) * frontRate(venue.venue, 'supermarket');
  const stocked = working.fixtures.filter(hasStock);
  const served = stocked.length > 0 ? Math.min(accepted, capacity) : 0;
  const unitsPerShelf = stocked.length > 0 ? served * SUPERMARKET.basket / stocked.length : 0;
  const sales = new Map<number, number>();
  const earnings = new Map<number, number>();
  const usage = new Map<number, number>();
  let gross = 0;
  for (const shelf of stocked) {
    const revenue = unitsPerShelf * unitPrice(shelf.good!, price);
    sales.set(shelf.id, unitsPerShelf);
    earnings.set(shelf.id, revenue);
    usage.set(shelf.id, unitsPerShelf);
    gross += revenue;
  }
  for (const checkout of checkouts) usage.set(checkout.id, served / checkouts.length);
  const hints = new Map<number, readonly LayoutHint[]>(working.fixtures.filter(fixture => isShelf(fixture) && !hasStock(fixture)).map(fixture => [fixture.id, ['emptyShelf']]));
  const shelves = working.fixtures.filter(isShelf);
  const coverage = shelves.length > 0 ? stocked.length / shelves.length : 0;
  const satisfaction = clamp01(0.35 * serviceRatio(accepted, capacity) + 0.35 * coverage + 0.3 * priceAcceptance(price));
  return { visitors, accepted, capacity, served, gross, earnings, usage, layout: { ...emptyLayout(attractiveness), hints }, satisfaction, sales };
};

export function sellStock(fixtures: readonly VenueFixture[], sales: ReadonlyMap<number, number>, hours: number): VenueFixture[] {
  return fixtures.map(fixture => {
    const rate = sales.get(fixture.id);
    if (rate === undefined || rate <= 0) return fixture;
    const left = stockOf(fixture) - rate * hours;
    return { ...fixture, stock: left <= SUPERMARKET.stockEpsilon ? 0 : left };
  });
}

// Time, after `from`, at which the first shelf runs out at the current rate of sales.
export function nextStockOut(fixtures: readonly VenueFixture[], sales: ReadonlyMap<number, number>, from: number, hourMs: number): number[] {
  return fixtures.flatMap(fixture => {
    const rate = sales.get(fixture.id);
    if (rate === undefined || rate <= 0) return [];
    const at = from + stockOf(fixture) / rate * hourMs;
    return at > from ? [at] : [];
  });
}

export const restockFee = (good: GoodId, units: number): number => Math.ceil(units * GOODS[good].value * SUPERMARKET.restockFee);

export interface Restocked {
  fixtures: VenueFixture[];
  goods: Storage['goods'];
  fee: number;
}

// Fills one shelf from the Storehouse, within the units available and the funds, paying a handling fee per unit.
export function restockShelf(fixtures: readonly VenueFixture[], goods: Storage['goods'], shelfId: number, good: GoodId, funds: number, limit = Infinity): Restocked | null {
  const shelf = fixtures.find(candidate => candidate.id === shelfId);
  if (!shelf || !isShelf(shelf)) return null;
  const capacity = FIXTURES[shelf.type].shelf!;
  const current = shelf.good === good ? Math.floor(stockOf(shelf)) : 0;
  const room = Math.max(0, capacity - current);
  const available = Math.floor(goods[good] ?? 0);
  let units = Math.min(room, available, limit);
  while (units > 0 && restockFee(good, units) > funds) units--;
  if (units <= 0) return null;
  const fee = restockFee(good, units);
  return {
    fixtures: fixtures.map(candidate => (candidate === shelf ? { ...shelf, good, stock: (shelf.good === good ? stockOf(shelf) : 0) + units } : candidate)),
    goods: { ...goods, [good]: (goods[good] ?? 0) - units },
    fee,
  };
}

// Each stocker refills, every hour, the shelf with the lowest fill that already carries a Good.
export function stockerRestocks(fixtures: readonly VenueFixture[], stockers: number, goods: Storage['goods'], funds: number): Restocked {
  let current = [...fixtures];
  let stock = goods;
  let spent = 0;
  const served = new Set<number>();
  for (let index = 0; index < stockers; index++) {
    const shelf = current
      .filter(candidate => isShelf(candidate) && candidate.good !== undefined && !served.has(candidate.id) && stockOf(candidate) < FIXTURES[candidate.type].shelf!)
      .sort((a, b) => stockOf(a) / FIXTURES[a.type].shelf! - stockOf(b) / FIXTURES[b.type].shelf! || a.id - b.id)[0];
    if (!shelf) break;
    served.add(shelf.id);
    const result = restockShelf(current, stock, shelf.id, shelf.good!, funds - spent, SUPERMARKET.stockerUnitsPerHour);
    if (!result) continue;
    current = result.fixtures;
    stock = result.goods;
    spent += result.fee;
  }
  return { fixtures: current, goods: stock, fee: spent };
}
