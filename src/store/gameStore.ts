import { createStore } from 'zustand/vanilla';
import { advance, newGame, type Command, type CommandError, type Difficulty, type GameState } from '../core';
import { restoreDeletion, type DeletionUndo } from '../core/engine/undo';
import { saveSession } from '../persistence/instance';
import type { LoadResult } from '../persistence/saveSession';
import { isSimulationRequested } from '../sim/simulationFlag';
import { isBypassTutorialRequested } from './bypassTutorialFlag';
import { tutorialEndToast, type CommandGateway } from './commandGateway';
import { liveCommandGateway } from './liveCommandGateway';
import { readOnlyStore } from './readOnlyStore';
import { announceEvents, toastStore } from './toastStore';

function announceTutorialEnd(before: GameState, after: GameState) {
  const toast = tutorialEndToast(before, after);
  if (toast) toastStore.getState().show(toast);
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
  newGame: (now: number, difficulty?: Difficulty) => void;
}

export function createGameStore(initial: GameState, gateway: CommandGateway = liveCommandGateway) {
  return createStore<GameStore>((set, get) => ({
    state: initial,
    deletionUndo: null,
    undo: () => {
      if (readOnlyStore.getState().readOnly) return;
      const { state, deletionUndo } = get();
      if (!deletionUndo) return;
      const result = advance(state, Date.now());
      announceEvents(result.events, result.state);
      set({ state: restoreDeletion(result.state, deletionUndo), deletionUndo: null, lastError: null, lastChange: 'command' });
    },
    lastError: null,
    lastChange: 'reset',
    send: (command) => {
      const outcome = gateway.apply(get().state, command);
      if (outcome.kind === 'blocked') return;
      if (outcome.kind === 'rejected') {
        toastStore.getState().show(outcome.error.key);
        return set({ lastError: outcome.error });
      }
      set({ state: outcome.state, deletionUndo: outcome.undo, lastError: null, lastChange: 'command' });
    },
    tick: (tickNow) => {
      if (readOnlyStore.getState().readOnly) return;
      const result = advance(get().state, tickNow);
      announceEvents(result.events, result.state);
      announceTutorialEnd(get().state, result.state);
      set({ state: result.state, lastChange: 'tick' });
    },
    replaceState: (state, change = 'reset') => set({ state, deletionUndo: null, lastError: null, lastChange: change }),
    newGame: (now, difficulty) => set({ state: newGame({ now, tutorial: !bypassTutorial, venueTutorials: !bypassTutorial, difficulty }), deletionUndo: null, lastError: null, lastChange: 'reset' }),
  }));
}

export const isSimulation = isSimulationRequested(window.location.search);
const bypassTutorial = isBypassTutorialRequested(window.location.search);

export const bootResult: LoadResult = isSimulation ? { kind: 'none' } : saveSession.load();

const startedAt = Date.now();
const freshGame = () => newGame({ now: startedAt, tutorial: !isSimulation && !bypassTutorial, venueTutorials: !bypassTutorial });
const initialState = bootResult.kind === 'loaded' ? bootResult.state : freshGame();

export const gameStore = createGameStore(initialState);
