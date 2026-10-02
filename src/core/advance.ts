import type { GameEvent } from './events';
import { advanceProduction } from './production';
import type { GameState } from './state';

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
}

export function advance(state: GameState, now: number): AdvanceResult {
  const effectiveNow = Math.max(now, state.lastSeen);
  const produced = advanceProduction(state, effectiveNow, effectiveNow - state.lastSeen);
  return { state: { ...produced.state, lastSeen: effectiveNow }, events: produced.events };
}
