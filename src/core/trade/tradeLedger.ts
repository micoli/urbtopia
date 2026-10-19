import { compartmentOf, storageCapacity, storageUsed, type Compartment } from '../economy/storage';
import { GOODS, MATERIALS } from '../economy/items';
import { isItemUnlocked } from '../progression/unlocks';
import type { ErrorKey } from '../engine/commands';
import type { GameState, Storage } from '../engine/state';
import { TRADE_EFFECTS, TRADE_LIMITS, type TradeEffect, type TradeLedgerEntry, type TradeLine } from './types';

export interface TradeApplyInput {
  offerId: string;
  effect: TradeEffect;
  lot?: readonly TradeLine[];
  urbs?: number;
  peer?: string;
}

export type TradeResult = { state: GameState } | { error: ErrorKey };

const LOT_EFFECTS: ReadonlySet<TradeEffect> = new Set(['reserve-lot', 'pay', 'receive-lot', 'return-lot']);
const URBS_EFFECTS: ReadonlySet<TradeEffect> = new Set(['pay', 'receive-payment', 'return-payment']);

function isWholeNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isTradeItem(item: string): boolean {
  return Object.hasOwn(MATERIALS, item) || Object.hasOwn(GOODS, item);
}

export function isTradeLine(value: unknown): value is TradeLine {
  if (typeof value !== 'object' || value === null) return false;
  const { item, quantity } = value as Partial<TradeLine>;
  return typeof item === 'string' && isTradeItem(item) && isWholeNumber(quantity, 1, TRADE_LIMITS.maxQuantity);
}

export function isValidLot(lot: readonly TradeLine[] | undefined): lot is readonly TradeLine[] {
  if (!lot || lot.length < 1 || lot.length > TRADE_LIMITS.maxLines) return false;
  if (new Set(lot.map((line) => line.item)).size !== lot.length) return false;
  return lot.every(isTradeLine);
}

export function findLedgerEntry(state: GameState, offerId: string, effect: TradeEffect): TradeLedgerEntry | undefined {
  return state.tradeLedger.find((entry) => entry.offerId === offerId && entry.effect === effect);
}

export function pendingTradeEntries(state: GameState): TradeLedgerEntry[] {
  return state.tradeLedger.filter((entry) => !entry.confirmed);
}

export function debitStorage(storage: Storage, lot: readonly TradeLine[]): Storage | ErrorKey {
  const materials = { ...storage.materials } as Record<string, number | undefined>;
  const goods = { ...storage.goods } as Record<string, number | undefined>;
  for (const line of lot) {
    const bucket = Object.hasOwn(MATERIALS, line.item) ? materials : goods;
    const available = bucket[line.item] ?? 0;
    if (available < line.quantity) return Object.hasOwn(MATERIALS, line.item) ? 'error.missingMaterials' : 'error.missingGoods';
    bucket[line.item] = available - line.quantity;
  }
  return { materials: materials as Storage['materials'], goods: goods as Storage['goods'] };
}

function credit(storage: Storage, lot: readonly TradeLine[]): Storage {
  const materials = { ...storage.materials } as Record<string, number | undefined>;
  const goods = { ...storage.goods } as Record<string, number | undefined>;
  for (const line of lot) {
    const bucket = Object.hasOwn(MATERIALS, line.item) ? materials : goods;
    bucket[line.item] = (bucket[line.item] ?? 0) + line.quantity;
  }
  return { materials: materials as Storage['materials'], goods: goods as Storage['goods'] };
}

// Whether the Lot fits the compartments as they are now, and is Unlocked when `requireUnlocked`.
export function lotReceiveIssue(state: GameState, lot: readonly TradeLine[], requireUnlocked: boolean): ErrorKey | null {
  if (requireUnlocked && lot.some((line) => !isItemUnlocked(state, line.item as Parameters<typeof isItemUnlocked>[1]))) return 'error.itemLocked';
  const used = storageUsed(state.storage);
  const capacity = storageCapacity(state);
  const added: Record<Compartment, number> = { materials: 0, crops: 0, goods: 0 };
  for (const line of lot) added[compartmentOf(line.item)] += line.quantity;
  const fits = (Object.keys(added) as Compartment[]).every((compartment) => used[compartment] + added[compartment] <= capacity[compartment]);
  return fits ? null : 'error.storageFull';
}

function withEntry(state: GameState, entry: TradeLedgerEntry): GameState {
  const kept = state.tradeLedger.filter((candidate) => candidate.at >= entry.at - TRADE_LIMITS.ledgerRetentionMs);
  return { ...state, tradeLedger: [...kept, entry] };
}

function applyEffect(state: GameState, effect: TradeEffect, lot: readonly TradeLine[] | undefined, urbs: number | undefined): TradeResult {
  if (effect === 'reserve-lot') {
    const storage = debitStorage(state.storage, lot!);
    return typeof storage === 'string' ? { error: storage } : { state: { ...state, storage } };
  }
  if (effect === 'pay') {
    const issue = lotReceiveIssue(state, lot!, true);
    if (issue) return { error: issue };
    if (state.urbs < urbs!) return { error: 'error.notEnoughUrbs' };
    return { state: { ...state, urbs: state.urbs - urbs! } };
  }
  if (effect === 'receive-lot' || effect === 'return-lot') {
    const issue = lotReceiveIssue(state, lot!, false);
    return issue ? { error: issue } : { state: { ...state, storage: credit(state.storage, lot!) } };
  }
  return { state: { ...state, urbs: state.urbs + urbs! } };
}

// Applies one local effect of a Trade offer exactly once: a second call with the same (offerId, effect) changes nothing.
export function applyTradeEffect(state: GameState, input: TradeApplyInput, now: number): TradeResult {
  const { offerId, effect, lot, urbs, peer } = input;
  if (typeof offerId !== 'string' || offerId === '' || !TRADE_EFFECTS.includes(effect)) return { error: 'error.unknownTrade' };
  if (findLedgerEntry(state, offerId, effect)) return { state };
  if (LOT_EFFECTS.has(effect) && !isValidLot(lot)) return { error: 'error.invalidTradeLot' };
  if (URBS_EFFECTS.has(effect) && !isWholeNumber(urbs, 0, TRADE_LIMITS.maxPrice)) return { error: 'error.invalidPrice' };

  const next = applyEffect(state, effect, lot, urbs);
  if ('error' in next) return next;

  const entry: TradeLedgerEntry = { offerId, effect, at: now, confirmed: false };
  if (lot) entry.lot = lot.map((line) => ({ item: line.item, quantity: line.quantity }));
  if (urbs !== undefined) entry.urbs = urbs;
  if (peer !== undefined) entry.peer = peer;
  return { state: withEntry(next.state, entry) };
}

export function confirmTradeEffect(state: GameState, offerId: string, effect: TradeEffect): TradeResult {
  const entry = findLedgerEntry(state, offerId, effect);
  if (!entry) return { error: 'error.unknownTrade' };
  if (entry.confirmed) return { state };
  return { state: { ...state, tradeLedger: state.tradeLedger.map((candidate) => (candidate === entry ? { ...entry, confirmed: true } : candidate)) } };
}

// Undoes a reserve-lot or pay that the server refused for good: gives back exactly what was taken, whatever the room.
export function rollbackTradeEffect(state: GameState, offerId: string, effect: TradeEffect): TradeResult {
  const entry = findLedgerEntry(state, offerId, effect);
  if (!entry || entry.confirmed || (effect !== 'reserve-lot' && effect !== 'pay')) return { error: 'error.unknownTrade' };
  const next: GameState =
    effect === 'reserve-lot'
      ? { ...state, storage: credit(state.storage, entry.lot ?? []) }
      : { ...state, urbs: state.urbs + (entry.urbs ?? 0) };
  return { state: { ...next, tradeLedger: next.tradeLedger.filter((candidate) => candidate !== entry) } };
}
