import { createStore } from 'zustand/vanilla';
import type { ErrorKey } from '../core';
import { readSeenChallenges, writeSeenChallenges } from '../challenges/seenChallenges';
import type { ChallengeErrorKind, ChallengeSnapshot } from '../challenges/types';

export type ChallengeStatus = 'idle' | 'loading' | 'sign-in-required' | 'ready' | 'offline';

export interface ChallengeActions {
  refresh: () => Promise<void>;
  poll: () => Promise<void>;
  accept: (challengeId: string) => Promise<boolean>;
  abandon: () => Promise<boolean>;
  setAside: (item: string, quantity: number) => Promise<ErrorKey | null>;
}

export interface ChallengeStore {
  enabled: boolean;
  status: ChallengeStatus;
  snapshot: ChallengeSnapshot | null;
  clockOffset: number;
  seen: string[];
  busy: boolean;
  failure: ChallengeErrorKind | null;
  actions: ChallengeActions | null;
  enable: (actions: ChallengeActions) => void;
  setStatus: (status: ChallengeStatus) => void;
  setSnapshot: (snapshot: ChallengeSnapshot | null) => void;
  markSeen: (ids: string[]) => void;
  setBusy: (busy: boolean) => void;
  setFailure: (failure: ChallengeErrorKind | null) => void;
}

export const challengeStore = createStore<ChallengeStore>((set, get) => ({
  enabled: false,
  status: 'idle',
  snapshot: null,
  clockOffset: 0,
  seen: readSeenChallenges(),
  busy: false,
  failure: null,
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setSnapshot: (snapshot) => set({ snapshot, ...(snapshot ? { clockOffset: snapshot.serverNow - Date.now() } : {}) }),
  markSeen: (ids) => {
    const fresh = ids.filter((id) => !get().seen.includes(id));
    if (fresh.length === 0) return;
    const seen = [...get().seen, ...fresh];
    writeSeenChallenges(seen);
    set({ seen });
  },
  setBusy: (busy) => set({ busy }),
  setFailure: (failure) => set({ failure }),
}));
