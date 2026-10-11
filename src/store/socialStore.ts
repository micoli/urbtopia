import { createStore } from 'zustand/vanilla';
import type { SocialErrorKind, SocialState } from '../social/types';

export type SocialStatus = 'idle' | 'loading' | 'no-handle' | 'ready' | 'offline';

export type HandleFormState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; error: SocialErrorKind; retryAfterSeconds: number | null };

export interface SocialActions {
  refresh: () => Promise<void>;
  setHandle: (handle: string) => Promise<void>;
  setFindable: (findable: boolean) => Promise<void>;
}

export interface SocialStore {
  enabled: boolean;
  status: SocialStatus;
  profile: SocialState | null;
  handleForm: HandleFormState;
  actions: SocialActions | null;
  enable: (actions: SocialActions) => void;
  setStatus: (status: SocialStatus) => void;
  setProfile: (profile: SocialState | null) => void;
  setHandleForm: (handleForm: HandleFormState) => void;
}

export const socialStore = createStore<SocialStore>((set) => ({
  enabled: false,
  status: 'idle',
  profile: null,
  handleForm: { kind: 'idle' },
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setProfile: (profile) => set({ profile }),
  setHandleForm: (handleForm) => set({ handleForm }),
}));
