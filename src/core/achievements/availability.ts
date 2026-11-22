import { DIFFICULTIES, difficultyOf } from '../engine/difficulty';
import type { GameState } from '../engine/state';
import type { AchievementDef } from './achievementTypes';

// An Achievement the City's Difficulty rules out cannot be earned.
export function isPossible(state: GameState, achievement: AchievementDef): boolean {
  if (!achievement.fromDifficulty) return true;
  return DIFFICULTIES.indexOf(difficultyOf(state)) >= DIFFICULTIES.indexOf(achievement.fromDifficulty);
}

// What the player can earn now: a possible Achievement whose beta feature, if any, is switched on. Only these count in a category.
export function isAvailable(state: GameState, achievement: AchievementDef, flags: ReadonlySet<string>): boolean {
  return isPossible(state, achievement) && (!achievement.flag || flags.has(achievement.flag));
}
