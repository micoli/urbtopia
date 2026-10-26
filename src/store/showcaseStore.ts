import { createStore } from 'zustand/vanilla';
import type { HallOfFameEntry, ShowcaseStatus } from '../showcase/types';

export type HallOfFameState = 'idle' | 'loading' | 'ready' | 'offline' | 'error';
export type VisitFailure = 'not-found' | 'newer-version' | 'invalid' | 'offline';

export type VisitState =
  | { kind: 'idle' }
  | { kind: 'loading'; userId: string }
  | { kind: 'visiting'; userId: string; handle: string; cityName: string; avatar: string | null }
  | { kind: 'failed'; reason: VisitFailure };

export interface ShowcaseActions {
  refreshHallOfFame: () => Promise<void>;
  acknowledgeNotice: () => Promise<void>;
  setOptOut: (optedOut: boolean) => Promise<void>;
  visit: (userId: string, cityId: string) => Promise<void>;
  leaveVisit: () => void;
}

export interface ShowcaseStore {
  enabled: boolean;
  status: ShowcaseStatus | null;
  hallOfFame: HallOfFameState;
  entries: HallOfFameEntry[];
  visit: VisitState;
  actions: ShowcaseActions | null;
  enable: (actions: ShowcaseActions) => void;
  setStatus: (status: ShowcaseStatus | null) => void;
  setHallOfFame: (hallOfFame: HallOfFameState, entries?: HallOfFameEntry[]) => void;
  setVisit: (visit: VisitState) => void;
}

export const showcaseStore = createStore<ShowcaseStore>((set, get) => ({
  enabled: false,
  status: null,
  hallOfFame: 'idle',
  entries: [],
  visit: { kind: 'idle' },
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setHallOfFame: (hallOfFame, entries) => set({ hallOfFame, entries: entries ?? get().entries }),
  setVisit: (visit) => set({ visit }),
}));
