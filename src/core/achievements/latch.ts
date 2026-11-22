import type { Command } from '../engine/commands';
import type { GameEvent } from '../engine/events';
import type { GameState } from '../engine/state';
import { ACHIEVEMENTS } from './achievements';
import { isPossible } from './availability';
import { isProvenBy, isRaised } from './triggers';

// The Achievements an existing City proves, for a save made before they existed.
export function provenAchievements(state: GameState): string[] {
  return ACHIEVEMENTS.filter((achievement) => isPossible(state, achievement) && isProvenBy(achievement.trigger, state)).map((achievement) => achievement.id);
}

export function isAcquired(state: GameState, id: string): boolean {
  return state.achievements?.includes(id) ?? false;
}

// A Replan only lays down again what was already placed, and a City read-only earns nothing: the callers skip those cases.
export function latchAchievements(before: GameState, after: GameState, events: readonly GameEvent[], command?: Command): { state: GameState; unlocked: string[] } {
  if (before.replan || after.replan) return { state: after, unlocked: [] };
  const unlocked = ACHIEVEMENTS.filter((achievement) => isPossible(after, achievement) && !isAcquired(after, achievement.id) && isRaised(achievement.trigger, { before, after, events, command })).map((achievement) => achievement.id);
  if (unlocked.length === 0) return { state: after, unlocked };
  return { state: { ...after, achievements: [...(after.achievements ?? []), ...unlocked] }, unlocked };
}

// The result of a simulation step or a Command, with the Achievements it earned latched and announced.
export function withAchievements<R extends { state: GameState; events: GameEvent[] }>(before: GameState, result: R, command?: Command): R {
  const latched = latchAchievements(before, result.state, result.events, command);
  if (latched.unlocked.length === 0) return result;
  return { ...result, state: latched.state, events: [...result.events, ...latched.unlocked.map((id): GameEvent => ({ type: 'AchievementUnlocked', id }))] };
}
