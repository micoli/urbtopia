import { shiftAttractionTimers } from '../tourism/gatheringWindow';
import { shiftCropTimers } from '../farming/growth';
import { citizensOf } from '../buildings/city';
import { RUSH, SHOP, TAX } from './economy';
import { isIndustryType, scalesRecipeWithYield } from './productionTypes';
import { advanceOffice } from './offices';
import { isShopType, saleIntervalOf } from './shops';
import type { GameEvent } from '../engine/events';
import { GOODS } from './items';
import { durationOf, valueOf, type ItemId } from './items';
import type { Building, GameState, QueueEntry, ShopStack } from '../engine/state';
import { productionTierOf } from './tiers';
import { isHomeType } from '../buildings/buildingDefinitions';
import { interiorBonusOfBuilding, interiorPowerOfBuilding } from '../factory/factoryInterior';

// A Mill or a Bakery consumes as many recipes as its yield per cycle.
export const recipeMultiplierOf = (building: Building): number => (scalesRecipeWithYield(building.type) ? productionTierOf(building).yield : 1);

export const productionDurationOf = (building: Building, item: ItemId): number =>
  Math.round(durationOf(item) * productionTierOf(building).durationFactor / (1 + interiorBonusOfBuilding(building, item).speed));

// Most units a cycle can bring: the yield of the Tier and the whole units a Factory interior can add to it.
export const maxQuantityOf = (building: Pick<Building, 'type' | 'tier' | 'interior'>): number =>
  Math.ceil(productionTierOf(building).yield * (1 + interiorBonusOfBuilding(building).yield) - CARRY_EPSILON);

const CARRY_EPSILON = 1e-9;

// A Factory interior adds a fraction of the yield to each cycle: the whole units are paid at once and the rest is carried to the next cycle,
// so a fair share comes out over many cycles with whole units only.
export function newQueueEntry(building: Building, item: ItemId, now: number): { entry: QueueEntry; building: Building } {
  const base = productionTierOf(building).yield;
  const bonus = interiorBonusOfBuilding(building, item).yield;
  const owed = bonus > 0 && building.interior ? base * bonus + (building.interior.carry ?? 0) : 0;
  const extra = Math.floor(owed + CARRY_EPSILON);
  const entry: QueueEntry = { item, duration: productionDurationOf(building, item), startedAt: isIdle(building) ? now : null, done: false, quantity: base + extra };
  if (owed === 0 || !building.interior) return { entry, building };
  return { entry, building: { ...building, interior: { ...building.interior, carry: Math.max(0, owed - extra) } } };
}

export function runningEntry(building: Building): QueueEntry | undefined {
  return building.queue.find((entry) => !entry.done && entry.startedAt !== null);
}

export function rushPrice(entry: QueueEntry, now: number): number {
  if (entry.startedAt === null) return 0;
  const remaining = clamp01((entry.startedAt + entry.duration - now) / entry.duration);
  return Math.max(RUSH.minPrice, Math.ceil(RUSH.priceFactor * valueOf(entry.item) * entry.quantity * remaining));
}

export function rushRunningProduction(building: Building, now: number): Building {
  const running = runningEntry(building);
  if (!running) return building;
  const next = building.queue.find((entry) => entry !== running && !entry.done);
  return {
    ...building,
    queue: building.queue.map((entry) => {
      if (entry === running) return { ...entry, done: true };
      if (entry === next) return { ...entry, startedAt: now };
      return entry;
    }),
  };
}

export function isIdle(building: Building): boolean {
  return building.queue.every((entry) => entry.done);
}

export function workProgress(building: Building, now: number): number | null {
  const running = building.queue.find((entry) => !entry.done && entry.startedAt !== null);
  if (running?.startedAt != null) return clamp01((now - running.startedAt) / running.duration);
  const nextSales = building.stacks.flatMap((stack) => (stack.stock > 0 && stack.nextSaleAt !== null ? [stack.nextSaleAt] : []));
  if (nextSales.length === 0) return null;
  return clamp01(1 - (Math.min(...nextSales) - now) / saleIntervalOf(building));
}

// Share of the whole stack sold, counting the unit being sold. 0 while the stack waits for its turn.
export function stackSaleProgress(stack: ShopStack, now: number, saleIntervalMs: number): number {
  if (stack.good === null) return 0;
  const sold = SHOP.stackSize - stack.stock;
  const current = stack.nextSaleAt === null || stack.stock === 0 ? 0 : clamp01(1 - (stack.nextSaleAt - now) / saleIntervalMs);
  return (sold + current) / SHOP.stackSize;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function isWorking(building: Building): boolean {
  if (building.stacks.some((stack) => stack.stock > 0 && stack.nextSaleAt !== null)) return true;
  return building.queue.some((entry) => !entry.done && entry.startedAt !== null);
}

interface Advanced {
  building: Building;
  events: GameEvent[];
}

export function advanceBuilding(building: Building, now: number): Advanced {
  if (building.queue.length === 0) return { building, events: [] };
  const queue = building.queue.map((entry) => ({ ...entry }));
  const events: GameEvent[] = [];
  for (let index = 0; index < queue.length; index++) {
    const entry = queue[index];
    if (!entry || entry.done) continue;
    if (entry.startedAt === null) break;
    const finishedAt = entry.startedAt + entry.duration;
    if (finishedAt > now) break;
    entry.done = true;
    events.push({ type: 'ProductionCompleted', buildingId: building.id, item: entry.item, at: finishedAt });
    const next = queue.slice(index + 1).find((candidate) => !candidate.done);
    if (next) next.startedAt = finishedAt;
  }
  return { building: { ...building, queue }, events };
}

interface SoldStack {
  stack: ShopStack;
  finishedAt: number | null;
}

function sellStack(stack: ShopStack, now: number, saleIntervalMs: number): SoldStack {
  if (stack.good === null || stack.stock === 0 || stack.nextSaleAt === null) return { stack, finishedAt: null };
  const unitValue = GOODS[stack.good].value;
  const cap = SHOP.stackSize * unitValue;
  let { stock, earned } = stack;
  let nextSaleAt: number | null = stack.nextSaleAt;
  let finishedAt: number | null = null;
  while (stock > 0 && nextSaleAt !== null && nextSaleAt <= now) {
    stock -= 1;
    earned = Math.min(cap, earned + unitValue);
    if (stock === 0) finishedAt = nextSaleAt;
    nextSaleAt = stock > 0 ? nextSaleAt + saleIntervalMs : null;
  }
  return { stack: { ...stack, stock, nextSaleAt, earned }, finishedAt };
}

const isStocked = (stack: ShopStack): boolean => stack.good !== null && stack.stock > 0;

// Stacks sell one after the other: only the selling stack has a sale timer, the stocked ones wait in Slot order.
function advanceShop(building: Building, now: number): Building {
  if (building.stacks.length === 0) return building;
  const interval = saleIntervalOf(building);
  const selling = building.stacks.findIndex((stack) => isStocked(stack) && stack.nextSaleAt !== null);
  let stacks = building.stacks.map((stack, index) => (index !== selling && stack.nextSaleAt !== null && isStocked(stack) ? { ...stack, nextSaleAt: null } : stack));
  let startAt: number | null = null;
  for (;;) {
    const index = startAt === null && selling !== -1 ? selling : stacks.findIndex(isStocked);
    if (index === -1) break;
    const current = stacks[index]!;
    const ready = current.nextSaleAt === null ? { ...current, nextSaleAt: (startAt ?? now) + interval } : current;
    const { stack, finishedAt } = sellStack(ready, now, interval);
    stacks = stacks.map((candidate, i) => (i === index ? stack : candidate));
    if (finishedAt === null) break;
    startAt = finishedAt;
  }
  return { ...building, stacks };
}

function advanceHome(building: Building, elapsedMs: number): Building {
  if (!isHomeType(building.type) || elapsedMs <= 0) return building;
  const citizens = citizensOf(building.tier);
  const cap = citizens * TAX.capHours * TAX.hourMs;
  return { ...building, taxCitizenMs: Math.min(cap, building.taxCitizenMs + citizens * elapsedMs) };
}

export function taxFillRatio(building: Building): number {
  const cap = citizensOf(building.tier) * TAX.capHours * TAX.hourMs;
  return cap > 0 ? building.taxCitizenMs / cap : 0;
}

export function taxDue(building: Building): number {
  return Math.floor((building.taxCitizenMs * TAX.urbsPerCitizenPerHour) / TAX.hourMs);
}

export function advanceProduction(state: GameState, now: number, elapsedMs: number, economicRatio = 1, homeRatios: ReadonlyMap<number, number> = new Map(), idleShops: ReadonlySet<number> = new Set(), filledJobs: ReadonlyMap<number, number> = new Map(), industrySpeed = 1): { state: GameState; events: GameEvent[] } {
  const results = state.buildings.map((building) => {
    const idle = idleShops.has(building.id);
    const drawsPower = building.type === 'packhouse' && interiorPowerOfBuilding(building) > 0;
    const ratio = isIndustryType(building.type) ? economicRatio * industrySpeed : economicRatio;
    const delay = idle ? elapsedMs : elapsedMs * (1 - ratio);
    const slowed = isIndustryType(building.type) || isShopType(building.type) || drawsPower ? {
      ...building,
      queue: building.queue.map(entry => entry.done || entry.startedAt === null ? entry : { ...entry, startedAt: entry.startedAt + delay }),
      stacks: building.stacks.map(stack => stack.nextSaleAt === null ? stack : { ...stack, nextSaleAt: stack.nextSaleAt + delay }),
    } : building;
    const produced = advanceBuilding(slowed, now);
    const housed = advanceHome(idle ? produced.building : advanceShop(produced.building, now), elapsedMs * (homeRatios.get(building.id) ?? 1));
    return { ...produced, building: advanceOffice(housed, filledJobs.get(building.id) ?? 0, elapsedMs * economicRatio) };
  });
  const events = results.flatMap((result) => result.events).sort((a, b) => ('at' in a && 'at' in b ? a.at - b.at : 0));
  return { state: { ...state, buildings: results.map((result) => result.building) }, events };
}

export function restartRunningProduction(building: Building, now: number): Building {
  const runningIndex = building.queue.findIndex((entry) => !entry.done);
  if (runningIndex === -1) return building;
  return {
    ...building,
    queue: building.queue.map((entry, index) => (index === runningIndex ? { ...entry, startedAt: now } : entry)),
  };
}

export function shiftRunningTimers(state: GameState, shiftMs: number): GameState {
  return shiftBoatTimers(shiftCropTimers(shiftBuildingTimers(state, shiftMs), shiftMs), shiftMs);
}

function shiftBoatTimers(state: GameState, shiftMs: number): GameState {
  if (!state.boats) return state;
  return { ...state, boats: state.boats.map((boat) => (boat.catchSince === undefined ? boat : { ...boat, catchSince: boat.catchSince + shiftMs })) };
}

function shiftBuildingTimers(state: GameState, shiftMs: number): GameState {
  const market = Object.fromEntries(Object.entries(state.market).map(([good, price]) => [good, { ...price, updatedAt: price.updatedAt + shiftMs }]));
  return {
    ...state,
    market,
    buildings: state.buildings.map((building) => shiftAttractionTimers({
      ...building,
      queue: building.queue.map((entry) => (entry.done || entry.startedAt === null ? entry : { ...entry, startedAt: entry.startedAt + shiftMs })),
      stacks: building.stacks.map((stack) => (stack.nextSaleAt === null ? stack : { ...stack, nextSaleAt: stack.nextSaleAt + shiftMs })),
    }, shiftMs)),
  };
}
