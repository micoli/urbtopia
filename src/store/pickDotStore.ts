import { createStore } from 'zustand/vanilla';

export const PICK_DOT_MS = 2000;

export interface PickDot {
  // Screen position in pixels, and a counter so that two clicks on the same point blink again.
  x: number;
  y: number;
  id: number;
}

export interface PickDotStore {
  dot: PickDot | null;
  show: (x: number, y: number) => void;
  clear: () => void;
}

let counter = 0;

// The debug mode shows where a click really picks, once the offset has moved it.
export const pickDotStore = createStore<PickDotStore>((set) => ({
  dot: null,
  show: (x, y) => set({ dot: { x, y, id: ++counter } }),
  clear: () => set({ dot: null }),
}));
