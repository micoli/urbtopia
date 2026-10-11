import { createStore } from 'zustand/vanilla';
import type { Message, SocialErrorKind, SocialState } from '../social/types';

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
  setHandle: (handle: string) => Promise<void>;
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
  actions: SocialActions | null;
  enable: (actions: SocialActions) => void;
  setStatus: (status: SocialStatus) => void;
  setProfile: (profile: SocialState | null) => void;
  setHandleForm: (handleForm: HandleFormState) => void;
  setSearch: (search: SearchState) => void;
  setActionFailure: (failure: ActionFailure | null) => void;
  setConversation: (conversation: ConversationState | null) => void;
}

export const socialStore = createStore<SocialStore>((set) => ({
  enabled: false,
  status: 'idle',
  profile: null,
  handleForm: { kind: 'idle' },
  search: { kind: 'idle' },
  actionFailure: null,
  conversation: null,
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setProfile: (profile) => set({ profile }),
  setHandleForm: (handleForm) => set({ handleForm }),
  setSearch: (search) => set({ search }),
  setActionFailure: (actionFailure) => set({ actionFailure }),
  setConversation: (conversation) => set({ conversation }),
}));
