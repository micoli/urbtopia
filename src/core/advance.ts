import { GAME_CONFIG } from './config';
import type { GameEvent } from './events';
import { advanceProduction, shiftRunningTimers } from './production';
import type { GameState } from './state';

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
}

export function advance(state: GameState, now: number): AdvanceResult {
  const effectiveNow = Math.max(now, state.lastSeen);
  const gap = effectiveNow - state.lastSeen;
  if (gap <= GAME_CONFIG.offlineCapMs) return replay(state, effectiveNow);

  const forfeitedMs = gap - GAME_CONFIG.offlineCapMs;
  const replayed = replay(state, state.lastSeen + GAME_CONFIG.offlineCapMs);
  return {
    state: { ...shiftRunningTimers(replayed.state, forfeitedMs), lastSeen: effectiveNow },
    events: [...replayed.events, { type: 'OfflineTimeCapped', forfeitedMs }],
  };
}

function replay(state: GameState, until: number): AdvanceResult {
  const produced = advanceProduction(state, until, until - state.lastSeen);
  return { state: { ...produced.state, lastSeen: until }, events: produced.events };
}
