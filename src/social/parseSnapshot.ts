import { TRADE_EFFECTS, TRADE_LIMITS, type TradeEffect, type TradeLine } from '../core';
import { SocialError, type BlockedPlayer, type Friend, type FriendRequest, type Message, type SocialSnapshot, type TradeClaim, type TradeOffer, type TradeOfferState, type TradeSlot } from './types';

type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rows(value: unknown): Row[] {
  if (!Array.isArray(value) || !value.every(isRow)) throw new SocialError('unknown');
  return value;
}

function text(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new SocialError('unknown');
  return value;
}

function time(row: Row, key: string): number {
  const parsed = Date.parse(text(row, key));
  if (Number.isNaN(parsed)) throw new SocialError('unknown');
  return parsed;
}

function number(row: Row, key: string): number {
  const value = row[key];
  if (typeof value !== 'number') throw new SocialError('unknown');
  return value;
}

export function parseSnapshot(json: unknown): SocialSnapshot {
  if (!isRow(json)) throw new SocialError('unknown');
  const revision = number(json, 'revision');
  if (json.changed === false) return { changed: false, revision };
  if (typeof json.findable !== 'boolean') throw new SocialError('unknown');
  return {
    changed: true,
    revision,
    handle: text(json, 'handle'),
    findable: json.findable,
    handleChangedAt: time(json, 'handleChangedAt'),
    friends: rows(json.friends).map((row): Friend => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), since: time(row, 'since'), unread: number(row, 'unread'), lastMessageAt: row.lastMessageAt === null ? null : time(row, 'lastMessageAt') })),
    incoming: rows(json.incoming).map((row): FriendRequest => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), at: time(row, 'at') })),
    outgoing: rows(json.outgoing).map((row): FriendRequest => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), at: time(row, 'at') })),
    offers: json.offers === undefined ? [] : rows(json.offers).map(parseOffer),
    blocked: rows(json.blocked).map((row): BlockedPlayer => ({ userId: text(row, 'userId'), handle: text(row, 'handle') })),
  };
}

export function parseMessages(json: unknown): Message[] {
  return rows(json).map((row): Message => {
    if (typeof row.fromMe !== 'boolean') throw new SocialError('unknown');
    return { id: number(row, 'id'), fromMe: row.fromMe, body: text(row, 'body'), at: time(row, 'at') };
  });
}

const OFFER_STATES: readonly TradeOfferState[] = ['open', 'accepted', 'refused', 'cancelled', 'expired', 'lapsed'];
const SLOTS: readonly TradeSlot[] = ['lot', 'payment'];

function parseLot(value: unknown): TradeLine[] {
  const lines = rows(value);
  if (lines.length < 1 || lines.length > TRADE_LIMITS.maxLines) throw new SocialError('unknown');
  return lines.map((line) => ({ item: text(line, 'item'), quantity: number(line, 'quantity') }));
}

function oneOf<T extends string>(row: Row, key: string, allowed: readonly T[]): T {
  const value = text(row, key);
  if (!allowed.includes(value as T)) throw new SocialError('unknown');
  return value as T;
}

function slotsOf(value: unknown): TradeSlot[] {
  if (!Array.isArray(value) || !value.every((slot) => SLOTS.includes(slot as TradeSlot))) throw new SocialError('unknown');
  return value as TradeSlot[];
}

function parseOffer(row: Row): TradeOffer {
  const claimable = slotsOf(row.claimable);
  const claimed = row.claimed === undefined ? [] : slotsOf(row.claimed);
  return {
    id: text(row, 'id'),
    role: oneOf(row, 'role', ['sender', 'recipient'] as const),
    peerId: text(row, 'peerId'),
    peerHandle: text(row, 'peerHandle'),
    lot: parseLot(row.lot),
    price: number(row, 'price'),
    state: oneOf(row, 'state', OFFER_STATES),
    createdAt: time(row, 'createdAt'),
    expiresAt: time(row, 'expiresAt'),
    claimDeadline: row.claimDeadline === null || row.claimDeadline === undefined ? null : time(row, 'claimDeadline'),
    claimable,
    claimed,
  };
}

export function parseTradeClaim(json: unknown): TradeClaim {
  if (!isRow(json)) throw new SocialError('unknown');
  const claim: TradeClaim = {
    offerId: text(json, 'offerId'),
    slot: oneOf(json, 'slot', SLOTS),
    effect: oneOf<TradeEffect>(json, 'effect', TRADE_EFFECTS),
    alreadyClaimed: json.alreadyClaimed === true,
  };
  if (json.lot !== null && json.lot !== undefined) claim.lot = parseLot(json.lot);
  if (json.urbs !== null && json.urbs !== undefined) claim.urbs = number(json, 'urbs');
  return claim;
}
