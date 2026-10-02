import { advance } from './advance';
import { handleCommand, isError, type Command, type CommandError } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './state';

export type DispatchResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError; state: GameState };

export function dispatch(state: GameState, command: Command, now: number): DispatchResult {
  const advanced = advance(state, now);
  const outcome = handleCommand(advanced.state, command, advanced.state.lastSeen);
  if (isError(outcome)) return { ok: false, error: outcome, state };
  return { ok: true, state: outcome.state, events: [...advanced.events, ...outcome.events] };
}
