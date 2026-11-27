import { createStore } from 'zustand/vanilla';

export type ReadOnlyReason = 'tab' | 'device';

export interface ReadOnlyStore {
  readOnly: boolean;
  reason: ReadOnlyReason | null;
  set: (readOnly: boolean, reason?: ReadOnlyReason) => void;
}

export const readOnlyStore = createStore<ReadOnlyStore>((set) => ({
  readOnly: false,
  reason: null,
  set: (readOnly, reason = 'tab') => set({ readOnly, reason: readOnly ? reason : null }),
}));
