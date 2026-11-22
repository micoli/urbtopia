import { advance } from './advance';
import { handleCommand, isError, type Command, type CommandError } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './state';
import { progressTutorial } from '../progression/tutorial';
import { progressVenueTutorials } from '../progression/venueTutorial';
import { withAchievements } from '../achievements/latch';
import { facilitiesUnlockedBetween } from '../progression/unlocks';

export type DispatchResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError; state: GameState };

export function dispatch(state: GameState, command: Command, now: number): DispatchResult {
  const advanced = advance(state, now);
  const outcome = handleCommand(advanced.state, command, advanced.state.lastSeen);
  if (isError(outcome)) return { ok: false, error: outcome, state };
  const progressed = progressVenueTutorials(progressTutorial(outcome.state));
  const unlocked = facilitiesUnlockedBetween(advanced.state, progressed).map((facility): GameEvent => ({ type: 'FacilityUnlocked', facility }));
  const events = [...advanced.events, ...outcome.events, ...unlocked];
  const result = { state: progressed, events };
  // Skipping the Tutorial hands over the starting City: the player built none of it.
  return { ok: true, ...(command.type === 'SkipTutorial' ? result : withAchievements(state, result)) };
}
