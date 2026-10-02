import { handleCommand, isError, type Command, type CommandError } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './state';

export type DispatchResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError; state: GameState };

export function dispatch(state: GameState, command: Command, now: number): DispatchResult {
  const outcome = handleCommand(state, command);
  if (isError(outcome)) return { ok: false, error: outcome, state };
  return { ok: true, state: { ...outcome.state, lastSeen: Math.max(state.lastSeen, now) }, events: outcome.events };
}
