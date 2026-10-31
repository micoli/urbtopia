import { createStore } from 'zustand/vanilla';

export interface ShowDialogStore {
  // The building a Show is being scheduled in.
  buildingId: number | null;
  open: (buildingId: number) => void;
  close: () => void;
}

export const showDialogStore = createStore<ShowDialogStore>(set => ({
  buildingId: null,
  open: buildingId => set({ buildingId }),
  close: () => set({ buildingId: null }),
}));
