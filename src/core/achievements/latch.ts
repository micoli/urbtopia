import type { GameEvent } from '../engine/events';
import type { GameState } from '../engine/state';
import { ACHIEVEMENTS } from './achievements';
import { isRaised } from './triggers';

export function isAcquired(state: GameState, id: string): boolean {
  return state.achievements?.includes(id) ?? false;
}

// A Replan only lays down again what was already placed, and a City read-only earns nothing: the callers skip those cases.
export function latchAchievements(before: GameState, after: GameState, events: readonly GameEvent[]): { state: GameState; unlocked: string[] } {
  if (before.replan || after.replan) return { state: after, unlocked: [] };
  const unlocked = ACHIEVEMENTS.filter((achievement) => !isAcquired(after, achievement.id) && isRaised(achievement.trigger, { before, after, events })).map((achievement) => achievement.id);
  if (unlocked.length === 0) return { state: after, unlocked };
  return { state: { ...after, achievements: [...(after.achievements ?? []), ...unlocked] }, unlocked };
}

// The result of a simulation step or a Command, with the Achievements it earned latched and announced.
export function withAchievements<R extends { state: GameState; events: GameEvent[] }>(before: GameState, result: R): R {
  const latched = latchAchievements(before, result.state, result.events);
  if (latched.unlocked.length === 0) return result;
  return { ...result, state: latched.state, events: [...result.events, ...latched.unlocked.map((id): GameEvent => ({ type: 'AchievementUnlocked', id }))] };
}
