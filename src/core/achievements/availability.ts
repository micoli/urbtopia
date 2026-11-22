import { DIFFICULTIES, difficultyOf } from '../engine/difficulty';
import type { GameState } from '../engine/state';
import type { AchievementDef } from './achievementTypes';

// An Achievement the City's Difficulty rules out cannot be earned, and is left out of its category.
export function isPossible(state: GameState, achievement: AchievementDef): boolean {
  if (!achievement.fromDifficulty) return true;
  return DIFFICULTIES.indexOf(difficultyOf(state)) >= DIFFICULTIES.indexOf(achievement.fromDifficulty);
}
