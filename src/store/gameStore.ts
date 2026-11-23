import { createStore } from 'zustand/vanilla';
import { advance, forfeitOfflineTime, newGame, withAchievements, type Command, type CommandError, type Difficulty, type GameState } from '../core';
import { standStill } from '../core/engine/advance';
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
  lastChange: Change;
  paused: boolean;
  suspend: (now: number) => (now: number) => void;
  send: (command: Command) => void;
  tick: (now: number) => void;
  forfeitOffline: (now: number) => void;
  replaceState: (state: GameState, change?: Change) => void;
  newGame: (now: number, difficulty?: Difficulty) => void;
}

// Shift absolute timers while preserving game-clock time and the adaptation grace period.
function suspendedState(state: GameState, elapsed: number): GameState {
  if (elapsed === 0) return state;
  const shifted = standStill(state, state.lastSeen + elapsed).state;
  return state.adaptationUntil === undefined ? shifted : { ...shifted, adaptationUntil: state.adaptationUntil + elapsed };
}

export function createGameStore(initial: GameState, gateway: CommandGateway = liveCommandGateway) {
  let leases = 0;
  let suspendedAt = 0;
  return createStore<GameStore>((set, get) => ({
    state: initial,
    lastError: null,
    lastChange: 'reset',
    paused: false,
    suspend: (now) => {
      if (leases++ === 0) {
        suspendedAt = now;
        set({ paused: true });
      }
      let released = false;
      return (resumedAt) => {
        if (released) return;
        released = true;
        if (--leases > 0) return;
        const state = get().state;
        const shifted = suspendedState(state, Math.max(0, resumedAt - suspendedAt));
        set({ state: shifted, paused: false, lastChange: 'tick' });
      };
    },
    send: (command) => {
      if (get().paused) return;
      const outcome = gateway.apply(get().state, command);
      if (outcome.kind === 'blocked') return;
      if (outcome.kind === 'rejected') {
        toastStore.getState().show(outcome.error.key);
        return set({ lastError: outcome.error });
      }
      set({ state: outcome.state, lastError: null, lastChange: 'command' });
    },
    tick: (tickNow) => {
      if (readOnlyStore.getState().readOnly) return;
      if (get().paused) {
        const state = suspendedState(get().state, Math.max(0, tickNow - suspendedAt));
        suspendedAt = Math.max(suspendedAt, tickNow);
        return set({ state, lastChange: 'tick' });
      }
      const result = withAchievements(get().state, advance(get().state, tickNow));
      announceEvents(result.events, result.state);
      announceTutorialEnd(get().state, result.state);
      set({ state: result.state, lastChange: 'tick' });
    },
    forfeitOffline: (tickNow) => {
      if (get().paused || readOnlyStore.getState().readOnly) return;
      const result = forfeitOfflineTime(get().state, tickNow);
      announceEvents(result.events, result.state);
      set({ state: result.state, lastChange: 'tick' });
    },
    replaceState: (state, change = 'reset') => set({ state, lastError: null, lastChange: change }),
    newGame: (now, difficulty) => set({ state: newGame({ now, tutorial: !bypassTutorial, venueTutorials: !bypassTutorial, difficulty }), lastError: null, lastChange: 'reset' }),
  }));
}

export const isSimulation = isSimulationRequested(window.location.search);
const bypassTutorial = isBypassTutorialRequested(window.location.search);

export const bootResult: LoadResult = isSimulation ? { kind: 'none' } : saveSession.load();

const startedAt = Date.now();
const freshGame = () => newGame({ now: startedAt, tutorial: !isSimulation && !bypassTutorial, venueTutorials: !bypassTutorial });
const initialState = bootResult.kind === 'loaded' ? bootResult.state : freshGame();

export const gameStore = createGameStore(initialState);
