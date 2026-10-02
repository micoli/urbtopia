import { createStore } from 'zustand/vanilla';
import { advance, dispatch, newGame, type Command, type CommandError, type GameState } from '../core';

export interface GameStore {
  state: GameState;
  lastError: CommandError | null;
  send: (command: Command) => void;
  tick: (now: number) => void;
}

export function createGameStore(now: number) {
  return createStore<GameStore>((set, get) => ({
    state: newGame({ now }),
    lastError: null,
    send: (command) => {
      const result = dispatch(get().state, command, Date.now());
      if (!result.ok) return set({ lastError: result.error });
      set({ state: result.state, lastError: null });
    },
    tick: (tickNow) => set({ state: advance(get().state, tickNow).state }),
  }));
}

export const gameStore = createGameStore(Date.now());
