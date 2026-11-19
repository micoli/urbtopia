import { createStore } from 'zustand/vanilla';
import { HEX_EDGE_COUNT, type Cell } from '../core';

// What the player is doing on the District plan screen: which Planning office is open, the cell picked and the turns given to the Hex in hand.
export interface DistrictStore {
  officeId: number | null;
  cell: Cell | null;
  rotation: number;
  open: (officeId: number) => void;
  close: () => void;
  selectCell: (cell: Cell | null) => void;
  rotate: () => void;
  clearDraft: () => void;
}

export const districtStore = createStore<DistrictStore>((set) => ({
  officeId: null,
  cell: null,
  rotation: 0,
  open: (officeId) => set({ officeId, cell: null, rotation: 0 }),
  close: () => set({ officeId: null, cell: null, rotation: 0 }),
  selectCell: (cell) => set({ cell }),
  rotate: () => set(store => ({ rotation: (store.rotation + 1) % HEX_EDGE_COUNT })),
  clearDraft: () => set({ cell: null, rotation: 0 }),
}));
