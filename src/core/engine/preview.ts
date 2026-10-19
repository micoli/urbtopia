import { handleCommand, isError, type Command, type ErrorKey } from './commands';
import type { GameState } from './state';

export interface CommandPreview {
  // Why the command would be refused now, null when it would be accepted.
  error: ErrorKey | null;
  // What it would charge in Urbs if the city could afford it, null when it is refused for another reason.
  cost: number | null;
}

// Enough to pay for any command without ever running out, small enough to keep fractional Urbs exact.
const UNLIMITED_URBS = 1_000_000_000;

// Answers "what would this command do" without running the rest of the pipeline: no time advance, no Tutorial step, no unlock, no undo capture.
export function previewCommand(state: GameState, command: Command): CommandPreview {
  const outcome = handleCommand(state, command, state.lastSeen);
  if (!isError(outcome)) return { error: null, cost: Math.max(0, state.urbs - outcome.state.urbs) };
  const funded = handleCommand({ ...state, urbs: UNLIMITED_URBS }, command, state.lastSeen);
  return { error: outcome.key, cost: isError(funded) ? null : Math.max(0, UNLIMITED_URBS - funded.state.urbs) };
}
