import { createStore } from 'zustand/vanilla';
import { advance, dispatch, newGame, type Command, type CommandError, type GameState } from '../core';
import { toastKeyForEvents, toastStore } from './toastStore';

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
      if (!result.ok) {
        toastStore.getState().show(result.error.key);
        return set({ lastError: result.error });
      }
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      set({ state: result.state, lastError: null });
    },
    tick: (tickNow) => {
      const result = advance(get().state, tickNow);
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      set({ state: result.state });
    },
  }));
}

export const gameStore = createGameStore(Date.now());
