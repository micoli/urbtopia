import type { TradeEffect, TradeLine } from '../core';

export type SocialErrorKind =
  | 'offline'
  | 'unauthenticated'
  | 'email-required'
  | 'handle-required'
  | 'handle-invalid'
  | 'handle-forbidden'
  | 'handle-taken'
  | 'handle-change-too-soon'
  | 'rate-limited'
  | 'message-invalid'
  | 'not-friends'
  | 'trade-invalid'
  | 'trade-conflict'
  | 'trade-unavailable'
  | 'cap-trades-open'
  | 'cap-friends'
  | 'cap-outgoing'
  | 'not-found'
  | 'unknown';

export class SocialError extends Error {
  constructor(
    readonly kind: SocialErrorKind,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`social-${kind}`);
  }
}

export interface Friend {
  userId: string;
  handle: string;
  since: number;
  unread: number;
  lastMessageAt: number | null;
}

export interface Message {
  id: number;
  fromMe: boolean;
  body: string;
  at: number;
}

export interface FriendRequest {
  userId: string;
  handle: string;
  at: number;
}

export interface BlockedPlayer {
  userId: string;
  handle: string;
}

export type TradeOfferState = 'open' | 'accepted' | 'refused' | 'cancelled' | 'expired' | 'lapsed';
export type TradeSlot = 'lot' | 'payment';

export interface TradeOffer {
  id: string;
  role: 'sender' | 'recipient';
  peerId: string;
  peerHandle: string;
  lot: TradeLine[];
  price: number;
  state: TradeOfferState;
  createdAt: number;
  expiresAt: number;
  claimDeadline: number | null;
  claimable: TradeSlot[];
  claimed: TradeSlot[];
}

export interface TradeClaim {
  offerId: string;
  slot: TradeSlot;
  effect: TradeEffect;
  alreadyClaimed: boolean;
  lot?: TradeLine[];
  urbs?: number;
}

export interface SocialState {
  revision: number;
  handle: string;
  findable: boolean;
  handleChangedAt: number;
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  blocked: BlockedPlayer[];
  offers: TradeOffer[];
}

export type SocialSnapshot = { changed: false; revision: number } | ({ changed: true } & SocialState);

export interface SocialClient {
  setHandle(handle: string): Promise<void>;
  setFindable(findable: boolean): Promise<void>;
  sendRequestByEmail(email: string): Promise<void>;
  acceptRequest(userId: string): Promise<void>;
  refuseRequest(userId: string): Promise<void>;
  removeFriend(userId: string): Promise<void>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  list(cursor?: number | null): Promise<SocialSnapshot>;
  sendMessage(userId: string, body: string): Promise<number>;
  listMessages(userId: string, afterId?: number): Promise<Message[]>;
  createTradeOffer(id: string, to: string, lot: TradeLine[], price: number): Promise<void>;
  acceptTradeOffer(id: string): Promise<void>;
  declineTradeOffer(id: string): Promise<void>;
  claimTrade(id: string, slot: TradeSlot): Promise<TradeClaim>;
}
