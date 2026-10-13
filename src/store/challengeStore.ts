import { createStore } from 'zustand/vanilla';
import type { ErrorKey } from '../core';
import type { ChallengeErrorKind, ChallengeSnapshot } from '../challenges/types';

export type ChallengeStatus = 'idle' | 'loading' | 'sign-in-required' | 'ready' | 'offline';

export interface ChallengeActions {
  refresh: () => Promise<void>;
  poll: () => Promise<void>;
  accept: (challengeId: string) => Promise<boolean>;
  setAside: (item: string, quantity: number) => Promise<ErrorKey | null>;
}

export interface ChallengeStore {
  enabled: boolean;
  status: ChallengeStatus;
  snapshot: ChallengeSnapshot | null;
  busy: boolean;
  failure: ChallengeErrorKind | null;
  actions: ChallengeActions | null;
  enable: (actions: ChallengeActions) => void;
  setStatus: (status: ChallengeStatus) => void;
  setSnapshot: (snapshot: ChallengeSnapshot | null) => void;
  setBusy: (busy: boolean) => void;
  setFailure: (failure: ChallengeErrorKind | null) => void;
}

export const challengeStore = createStore<ChallengeStore>((set) => ({
  enabled: false,
  status: 'idle',
  snapshot: null,
  busy: false,
  failure: null,
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setBusy: (busy) => set({ busy }),
  setFailure: (failure) => set({ failure }),
}));
