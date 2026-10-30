import { createStore } from 'zustand/vanilla';

export type ClubTabId = 'squad' | 'lineup' | 'market' | 'match' | 'table';

export interface ClubStore {
  // The stadium whose Club is open.
  buildingId: number | null;
  tab: ClubTabId;
  open: (buildingId: number) => void;
  close: () => void;
  select: (tab: ClubTabId) => void;
}

export const clubStore = createStore<ClubStore>(set => ({
  buildingId: null,
  tab: 'squad',
  open: buildingId => set({ buildingId, tab: 'squad' }),
  close: () => set({ buildingId: null }),
  select: tab => set({ tab }),
}));
