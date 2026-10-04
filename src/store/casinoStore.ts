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
  spent: number;
  won: number;
  play: (casinoId: number, game: CasinoGame) => void;
  close: () => void;
  showSpin: (spin: SlotSpunEvent) => void;
  startRound: (round: CasinoRoundStartedEvent) => void;
  settleRound: (settled: BlackjackSettledEvent | BlockmatchSettledEvent) => void;
  record: (spent: number, won: number) => void;
}

export const casinoStore = createStore<CasinoStore>((set) => ({
  casinoId: null,
  game: null,
  lastSpin: null,
  round: null,
  settled: null,
  spent: 0,
  won: 0,
  play: (casinoId, game) => set({ casinoId, game, lastSpin: null, round: null, settled: null, spent: 0, won: 0 }),
  close: () => set({ casinoId: null, game: null, lastSpin: null, round: null, settled: null, spent: 0, won: 0 }),
  showSpin: (lastSpin) => set({ lastSpin }),
  startRound: (round) => set({ round, settled: null }),
  settleRound: (settled) => set({ settled, round: null }),
  record: (spent, won) => set(store => ({ spent: store.spent + spent, won: store.won + won })),
}));
