import { createStore } from 'zustand/vanilla';
import type { CasinoGame, GameEvent } from '../core';

export type SlotSpunEvent = Extract<GameEvent, { type: 'SlotSpun' }>;
export type CasinoRoundStartedEvent = Extract<GameEvent, { type: 'CasinoRoundStarted' }>;
export type BlackjackSettledEvent = Extract<GameEvent, { type: 'BlackjackSettled' }>;
export type BlockmatchSettledEvent = Extract<GameEvent, { type: 'BlockmatchSettled' }>;

export interface CasinoStore {
  casinoId: number | null;
  game: CasinoGame | null;
  lastSpin: SlotSpunEvent | null;
  round: CasinoRoundStartedEvent | null;
  settled: BlackjackSettledEvent | BlockmatchSettledEvent | null;
  play: (casinoId: number, game: CasinoGame) => void;
  close: () => void;
  showSpin: (spin: SlotSpunEvent) => void;
  startRound: (round: CasinoRoundStartedEvent) => void;
  settleRound: (settled: BlackjackSettledEvent | BlockmatchSettledEvent) => void;
}

export const casinoStore = createStore<CasinoStore>((set) => ({
  casinoId: null,
  game: null,
  lastSpin: null,
  round: null,
  settled: null,
  play: (casinoId, game) => set({ casinoId, game, lastSpin: null, round: null, settled: null }),
  close: () => set({ casinoId: null, game: null, lastSpin: null, round: null, settled: null }),
  showSpin: (lastSpin) => set({ lastSpin }),
  startRound: (round) => set({ round, settled: null }),
  settleRound: (settled) => set({ settled, round: null }),
}));
