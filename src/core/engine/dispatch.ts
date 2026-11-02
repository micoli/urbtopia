import { advance } from './advance';
import { handleCommand, isError, type Command, type CommandError } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './state';
import { progressTutorial } from '../progression/tutorial';
import { progressVenueTutorials } from '../progression/venueTutorial';
import { facilitiesUnlockedBetween } from '../progression/unlocks';

export type DispatchResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError; state: GameState };

export function dispatch(state: GameState, command: Command, now: number): DispatchResult {
  const advanced = advance(state, now);
  const outcome = handleCommand(advanced.state, command, advanced.state.lastSeen);
  if (isError(outcome)) return { ok: false, error: outcome, state };
  const next = progressVenueTutorials(progressTutorial(outcome.state));
  const unlocked = facilitiesUnlockedBetween(advanced.state, next).map((facility): GameEvent => ({ type: 'FacilityUnlocked', facility }));
  return { ok: true, state: next, events: [...advanced.events, ...outcome.events, ...unlocked] };
}
