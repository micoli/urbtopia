import { createStore } from 'zustand/vanilla';
import { advance, dispatch, newGame, type Command, type CommandError, type GameState } from '../core';
import { saveSession } from '../persistence/instance';
import type { LoadResult } from '../persistence/saveSession';
import { readOnlyStore } from './readOnlyStore';
import { toastKeyForEvents, toastStore } from './toastStore';

export type Change = 'command' | 'tick' | 'reset';

export interface GameStore {
  state: GameState;
  lastError: CommandError | null;
  lastChange: Change;
  send: (command: Command) => void;
  tick: (now: number) => void;
  replaceState: (state: GameState, change?: Change) => void;
  newGame: (now: number) => void;
}

export function createGameStore(initial: GameState) {
  return createStore<GameStore>((set, get) => ({
    state: initial,
    lastError: null,
    lastChange: 'reset',
    send: (command) => {
      if (readOnlyStore.getState().readOnly) return;
      const result = dispatch(get().state, command, Date.now());
      if (!result.ok) {
        toastStore.getState().show(result.error.key);
        return set({ lastError: result.error });
      }
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      set({ state: result.state, lastError: null, lastChange: 'command' });
    },
    tick: (tickNow) => {
      if (readOnlyStore.getState().readOnly) return;
      const result = advance(get().state, tickNow);
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      set({ state: result.state, lastChange: 'tick' });
    },
    replaceState: (state, change = 'reset') => set({ state, lastError: null, lastChange: change }),
    newGame: (now) => set({ state: newGame({ now }), lastError: null, lastChange: 'reset' }),
  }));
}

export const bootResult: LoadResult = saveSession.load();

const startedAt = Date.now();
const initialState = bootResult.kind === 'loaded' ? bootResult.state : newGame({ now: startedAt });

export const gameStore = createGameStore(initialState);
