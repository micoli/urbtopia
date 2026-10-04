import { createStore } from 'zustand/vanilla';
import { advance, dispatch, newGame, type Command, type CommandError, type GameState } from '../core';
import { restoreDeletion, type DeletionUndo } from '../core/engine/undo';
import { saveSession } from '../persistence/instance';
import type { LoadResult } from '../persistence/saveSession';
import { isSimulationRequested } from '../sim/simulationFlag';
import { casinoStore } from './casinoStore';
import { harvestEffects } from './harvestEffects';
import { readOnlyStore } from './readOnlyStore';
import { toastKeyForEvents, toastStore } from './toastStore';

function announceTutorialEnd(before: GameState, after: GameState) {
  if (before.tutorial === 'tax' && after.tutorial === null) toastStore.getState().show('tutorial.done');
}

export type Change = 'command' | 'tick' | 'reset';

export interface GameStore {
  state: GameState;
  lastError: CommandError | null;
  deletionUndo: DeletionUndo | null;
  undo: () => void;
  lastChange: Change;
  send: (command: Command) => void;
  tick: (now: number) => void;
  replaceState: (state: GameState, change?: Change) => void;
  newGame: (now: number) => void;
}

export function createGameStore(initial: GameState) {
  return createStore<GameStore>((set, get) => ({
    state: initial,
    deletionUndo: null,
    undo: () => {
      if (readOnlyStore.getState().readOnly) return;
      const { state, deletionUndo } = get();
      if (!deletionUndo) return;
      const result = advance(state, Date.now());
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      set({ state: restoreDeletion(result.state, deletionUndo), deletionUndo: null, lastError: null, lastChange: 'command' });
    },
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
      for (const event of result.events) {
        if (event.type === 'CropsHarvested') harvestEffects.getState().show(event.tiles);
        if (event.type === 'SlotSpun') {
          casinoStore.getState().record(event.stake, event.payout);
          casinoStore.getState().showSpin(event);
        }
        if (event.type === 'CasinoRoundStarted') {
          casinoStore.getState().record(event.stake, 0);
          casinoStore.getState().startRound(event);
        }
        if (event.type === 'BlackjackSettled') {
          casinoStore.getState().record(event.doubled ? event.stake : 0, event.payout);
          casinoStore.getState().settleRound(event);
        }
        if (event.type === 'BlockmatchSettled') {
          casinoStore.getState().record(0, event.payout);
          casinoStore.getState().settleRound(event);
        }
      }
      announceTutorialEnd(get().state, result.state);
      set({ state: result.state, deletionUndo: result.undo, lastError: null, lastChange: 'command' });
    },
    tick: (tickNow) => {
      if (readOnlyStore.getState().readOnly) return;
      const result = advance(get().state, tickNow);
      const toast = toastKeyForEvents(result.events);
      if (toast) toastStore.getState().show(toast);
      announceTutorialEnd(get().state, result.state);
      set({ state: result.state, lastChange: 'tick' });
    },
    replaceState: (state, change = 'reset') => set({ state, deletionUndo: null, lastError: null, lastChange: change }),
    newGame: (now) => set({ state: newGame({ now, tutorial: true }), deletionUndo: null, lastError: null, lastChange: 'reset' }),
  }));
}

export const isSimulation = isSimulationRequested(window.location.search);

export const bootResult: LoadResult = isSimulation ? { kind: 'none' } : saveSession.load();

const startedAt = Date.now();
const freshGame = () => newGame({ now: startedAt, tutorial: !isSimulation });
const initialState = bootResult.kind === 'loaded' ? bootResult.state : freshGame();

export const gameStore = createGameStore(initialState);
