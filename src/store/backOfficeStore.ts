import { createStore } from 'zustand/vanilla';

export interface BackOfficeLoadedSave {
  handle: string | null;
  revision: number;
  report?: boolean;
}

export interface BackOfficeStore {
  loaded: BackOfficeLoadedSave | null;
  setLoaded: (loaded: BackOfficeLoadedSave | null) => void;
}

export const backOfficeStore = createStore<BackOfficeStore>((set) => ({
  loaded: null,
  setLoaded: (loaded) => set({ loaded }),
}));
