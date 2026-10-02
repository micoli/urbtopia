import type { GameEvent } from './events';
import type { GameState } from './state';

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
}

export function advance(state: GameState, now: number): AdvanceResult {
  const effectiveNow = Math.max(now, state.lastSeen);
  return { state: { ...state, lastSeen: effectiveNow }, events: [] };
}
