import { createStore } from 'zustand/vanilla';

export interface ReadOnlyStore {
  readOnly: boolean;
  set: (readOnly: boolean) => void;
}

export const readOnlyStore = createStore<ReadOnlyStore>((set) => ({
  readOnly: false,
  set: (readOnly) => set({ readOnly }),
}));
