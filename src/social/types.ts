import type { MedalInfo } from '../challenges/types';
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
  | 'avatar-invalid'
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
  | 'not-creator'
  | 'group-name-invalid'
  | 'group-name-forbidden'
  | 'group-full'
  | 'group-creator-cannot-leave'
  | 'cap-groups-created'
  | 'cap-groups-joined'
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
  avatar: string | null;
  since: number;
  unread: number;
  lastMessageAt: number | null;
  medals: MedalInfo[];
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
  avatar: string | null;
  at: number;
}

export interface BlockedPlayer {
  userId: string;
  handle: string;
  avatar: string | null;
}

export type TradeOfferState = 'open' | 'accepted' | 'refused' | 'cancelled' | 'expired' | 'lapsed';
export type TradeSlot = 'lot' | 'payment';

export interface TradeOffer {
  id: string;
  role: 'sender' | 'recipient';
  peerId: string;
  peerHandle: string;
  peerAvatar: string | null;
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
  avatar: string | null;
  findable: boolean;
  handleChangedAt: number;
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  blocked: BlockedPlayer[];
  offers: TradeOffer[];
}

export interface GroupMember {
  userId: string;
  handle: string;
  avatar: string | null;
}

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  members: GroupMember[];
  unread: number;
  lastMessageAt: number | null;
  lastMessageFrom: string | null;
  lastMessagePreview: string | null;
}

export interface GroupMessage {
  id: number;
  fromMe: boolean;
  senderId: string;
  senderHandle: string;
  senderAvatar: string | null;
  body: string;
  at: number;
}

export type GroupsSnapshot = { changed: false; revision: number } | { changed: true; revision: number; groups: Group[] };

export type SocialSnapshot = { changed: false; revision: number } | ({ changed: true } & SocialState);

export interface SocialClient {
  setHandle(handle: string): Promise<void>;
  setAvatar(avatar: string | null): Promise<void>;
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
  listGroups(cursor?: number | null): Promise<GroupsSnapshot>;
  createGroup(name: string, memberIds: string[]): Promise<string>;
  renameGroup(groupId: string, name: string): Promise<void>;
  addGroupMembers(groupId: string, memberIds: string[]): Promise<void>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  leaveGroup(groupId: string): Promise<void>;
  deleteGroup(groupId: string): Promise<void>;
  sendGroupMessage(groupId: string, body: string): Promise<number>;
  listGroupMessages(groupId: string, afterId?: number): Promise<GroupMessage[]>;
}
