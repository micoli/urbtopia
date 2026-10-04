import { createStore } from 'zustand/vanilla';
import type { CasinoGame, GameEvent } from '../core';

export type SlotSpunEvent = Extract<GameEvent, { type: 'SlotSpun' }>;

export interface CasinoStore {
  casinoId: number | null;
  game: CasinoGame | null;
  lastSpin: SlotSpunEvent | null;
  play: (casinoId: number, game: CasinoGame) => void;
  close: () => void;
  showSpin: (spin: SlotSpunEvent) => void;
}

export const casinoStore = createStore<CasinoStore>((set) => ({
  casinoId: null,
  game: null,
  lastSpin: null,
  play: (casinoId, game) => set({ casinoId, game, lastSpin: null }),
  close: () => set({ casinoId: null, game: null, lastSpin: null }),
  showSpin: (lastSpin) => set({ lastSpin }),
}));
