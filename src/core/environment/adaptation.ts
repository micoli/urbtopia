import type { GameState } from '../engine/state';

export function isAdapting(state: GameState): boolean {
  return (state.adaptationUntil ?? 0) > state.lastSeen;
}
