import { citizensOf } from './city';
import { SHOP, TAX } from './economy';
import type { GameEvent } from './events';
import { GOODS } from './items';
import { durationOf, type ItemId } from './items';
import type { Building, GameState, QueueEntry, ShopStack } from './state';
import { productionTierOf } from './tiers';

export function newQueueEntry(building: Building, item: ItemId, now: number): QueueEntry {
  const { durationFactor, yield: quantity } = productionTierOf(building);
  return { item, duration: Math.round(durationOf(item) * durationFactor), startedAt: isIdle(building) ? now : null, done: false, quantity };
}

export function isIdle(building: Building): boolean {
  return building.queue.every((entry) => entry.done);
}

export function workProgress(building: Building, now: number): number | null {
  const running = building.queue.find((entry) => !entry.done && entry.startedAt !== null);
  if (running?.startedAt != null) return clamp01((now - running.startedAt) / running.duration);
  const nextSales = building.stacks.flatMap((stack) => (stack.stock > 0 && stack.nextSaleAt !== null ? [stack.nextSaleAt] : []));
  if (nextSales.length === 0) return null;
  return clamp01(1 - (Math.min(...nextSales) - now) / SHOP.saleIntervalMs);
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

function advanceBuilding(building: Building, now: number): Advanced {
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

function advanceStack(stack: ShopStack, now: number): ShopStack {
  if (stack.good === null || stack.stock === 0 || stack.nextSaleAt === null) return stack;
  const unitValue = GOODS[stack.good].value;
  const cap = SHOP.stackSize * unitValue;
  let { stock, earned } = stack;
  let nextSaleAt: number | null = stack.nextSaleAt;
  while (stock > 0 && nextSaleAt !== null && nextSaleAt <= now) {
    stock -= 1;
    earned = Math.min(cap, earned + unitValue);
    nextSaleAt = stock > 0 ? nextSaleAt + SHOP.saleIntervalMs : null;
  }
  return { ...stack, stock, nextSaleAt, earned };
}

function advanceShop(building: Building, now: number): Building {
  if (building.stacks.length === 0) return building;
  return { ...building, stacks: building.stacks.map((stack) => advanceStack(stack, now)) };
}

function advanceHome(building: Building, elapsedMs: number): Building {
  if (building.type !== 'home' || elapsedMs <= 0) return building;
  const citizens = citizensOf(building.tier);
  const cap = citizens * TAX.capHours * TAX.hourMs;
  return { ...building, taxCitizenMs: Math.min(cap, building.taxCitizenMs + citizens * elapsedMs) };
}

export function taxDue(building: Building): number {
  return Math.floor((building.taxCitizenMs * TAX.urbsPerCitizenPerHour) / TAX.hourMs);
}

export function advanceProduction(state: GameState, now: number, elapsedMs: number): { state: GameState; events: GameEvent[] } {
  const results = state.buildings.map((building) => {
    const produced = advanceBuilding(building, now);
    return { ...produced, building: advanceHome(advanceShop(produced.building, now), elapsedMs) };
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
  const market = Object.fromEntries(Object.entries(state.market).map(([good, price]) => [good, { ...price, updatedAt: price.updatedAt + shiftMs }]));
  return {
    ...state,
    market,
    buildings: state.buildings.map((building) => ({
      ...building,
      queue: building.queue.map((entry) => (entry.done || entry.startedAt === null ? entry : { ...entry, startedAt: entry.startedAt + shiftMs })),
      stacks: building.stacks.map((stack) => (stack.nextSaleAt === null ? stack : { ...stack, nextSaleAt: stack.nextSaleAt + shiftMs })),
    })),
  };
}
