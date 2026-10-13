import { createStore } from 'zustand/vanilla';
import type { TradeLine } from '../core';
import type { TradeFailure, TradeOutcome } from '../social/tradeCoordinator';
import type { Group, GroupMessage, Message, SocialErrorKind, SocialState, TradeOffer } from '../social/types';

export type SocialStatus = 'idle' | 'loading' | 'no-handle' | 'ready' | 'offline';

export type HandleFormState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; error: SocialErrorKind; retryAfterSeconds: number | null };

export type SearchState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'invalid-email' } | { kind: 'error'; error: SocialErrorKind; retryAfterSeconds: number | null };

export interface ActionFailure {
  error: SocialErrorKind;
  retryAfterSeconds: number | null;
}

export interface ConversationState {
  userId: string;
  handle: string;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  failure: ActionFailure | null;
}

export interface GroupConversationState {
  groupId: string;
  messages: GroupMessage[];
  loading: boolean;
  sending: boolean;
  failure: ActionFailure | null;
}

export interface GroupActions {
  refresh: () => Promise<void>;
  poll: () => Promise<void>;
  create: (name: string, memberIds: string[]) => Promise<boolean>;
  rename: (groupId: string, name: string) => Promise<boolean>;
  addMembers: (groupId: string, memberIds: string[]) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  blockMember: (userId: string) => Promise<void>;
  leave: (groupId: string) => Promise<void>;
  remove: (groupId: string) => Promise<void>;
  open: (groupId: string) => Promise<void>;
  close: () => Promise<void>;
  send: (body: string) => Promise<void>;
  pollOpen: () => Promise<void>;
  refreshOpen: () => Promise<void>;
}

export interface SocialActions {
  refresh: () => Promise<void>;
  poll: () => Promise<void>;
  sendRequest: (email: string) => Promise<void>;
  accept: (userId: string) => Promise<void>;
  refuse: (userId: string) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
  openConversation: (userId: string, handle: string) => Promise<void>;
  closeConversation: () => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
  pollConversation: () => Promise<void>;
  refreshConversation: () => Promise<void>;
  createTradeOffer: (to: string, lot: TradeLine[], price: number) => Promise<TradeOutcome>;
  acceptTradeOffer: (offer: TradeOffer) => Promise<TradeOutcome>;
  declineTradeOffer: (offerId: string) => Promise<TradeOutcome>;
  reconcileTrades: () => Promise<void>;
  setHandle: (handle: string) => Promise<void>;
  setAvatar: (avatar: string | null) => Promise<void>;
  setFindable: (findable: boolean) => Promise<void>;
}

export interface SocialStore {
  enabled: boolean;
  status: SocialStatus;
  profile: SocialState | null;
  handleForm: HandleFormState;
  search: SearchState;
  actionFailure: ActionFailure | null;
  conversation: ConversationState | null;
  tradeBusy: boolean;
  tradeFailure: TradeFailure | null;
  groups: Group[] | null;
  groupsRevision: number | null;
  groupConversation: GroupConversationState | null;
  groupBusy: boolean;
  groupFailure: ActionFailure | null;
  actions: SocialActions | null;
  groupActions: GroupActions | null;
  enable: (actions: SocialActions, groupActions: GroupActions) => void;
  setStatus: (status: SocialStatus) => void;
  setProfile: (profile: SocialState | null) => void;
  setHandleForm: (handleForm: HandleFormState) => void;
  setSearch: (search: SearchState) => void;
  setActionFailure: (failure: ActionFailure | null) => void;
  setConversation: (conversation: ConversationState | null) => void;
  setTrade: (trade: { busy: boolean; failure: TradeFailure | null }) => void;
  setGroups: (groups: Group[] | null, revision: number | null) => void;
  setGroupConversation: (conversation: GroupConversationState | null) => void;
  setGroupBusy: (busy: boolean) => void;
  setGroupFailure: (failure: ActionFailure | null) => void;
}

export const socialStore = createStore<SocialStore>((set) => ({
  enabled: false,
  status: 'idle',
  profile: null,
  handleForm: { kind: 'idle' },
  search: { kind: 'idle' },
  actionFailure: null,
  conversation: null,
  tradeBusy: false,
  tradeFailure: null,
  groups: null,
  groupsRevision: null,
  groupConversation: null,
  groupBusy: false,
  groupFailure: null,
  actions: null,
  groupActions: null,
  enable: (actions, groupActions) => set({ enabled: true, actions, groupActions }),
  setStatus: (status) => set({ status }),
  setProfile: (profile) => set({ profile }),
  setHandleForm: (handleForm) => set({ handleForm }),
  setSearch: (search) => set({ search }),
  setActionFailure: (actionFailure) => set({ actionFailure }),
  setConversation: (conversation) => set({ conversation }),
  setTrade: ({ busy, failure }) => set({ tradeBusy: busy, tradeFailure: failure }),
  setGroups: (groups, groupsRevision) => set({ groups, groupsRevision }),
  setGroupConversation: (groupConversation) => set({ groupConversation }),
  setGroupBusy: (groupBusy) => set({ groupBusy }),
  setGroupFailure: (groupFailure) => set({ groupFailure }),
}));
