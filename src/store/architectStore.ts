import { createStore } from 'zustand/vanilla';

// Which Architect office has its studio open.
export interface ArchitectStore {
  officeId: number | null;
  open: (officeId: number) => void;
  close: () => void;
}

export const architectStore = createStore<ArchitectStore>((set) => ({
  officeId: null,
  open: (officeId) => set({ officeId }),
  close: () => set({ officeId: null }),
}));
