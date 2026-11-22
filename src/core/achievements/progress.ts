import { DIFFICULTIES, difficultyOf } from '../engine/difficulty';
import type { GameState } from '../engine/state';
import { ACHIEVEMENTS, achievementsOf } from './achievements';
import { ACHIEVEMENT_CATEGORIES, type AchievementCategoryId, type AchievementDef } from './achievementTypes';
import { isAcquired } from './latch';

export function isPossible(state: GameState, achievement: AchievementDef): boolean {
  if (!achievement.fromDifficulty) return true;
  return DIFFICULTIES.indexOf(difficultyOf(state)) >= DIFFICULTIES.indexOf(achievement.fromDifficulty);
}

export interface CategoryProgress {
  readonly category: AchievementCategoryId;
  readonly acquired: number;
  readonly total: number;
  readonly complete: boolean;
}

// An Achievement the City's Difficulty rules out is left out of the count.
export function categoryProgress(state: GameState, category: AchievementCategoryId): CategoryProgress {
  const possible = achievementsOf(category).filter((achievement) => isPossible(state, achievement));
  const acquired = possible.filter((achievement) => isAcquired(state, achievement.id)).length;
  return { category, acquired, total: possible.length, complete: possible.length > 0 && acquired === possible.length };
}

// A category with no possible Achievement is hidden.
export function visibleCategories(state: GameState): CategoryProgress[] {
  return ACHIEVEMENT_CATEGORIES.map((category) => categoryProgress(state, category)).filter((progress) => progress.total > 0);
}

export function completedCategories(state: GameState): AchievementCategoryId[] {
  return ACHIEVEMENT_CATEGORIES.filter((category) => categoryProgress(state, category).complete);
}

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;
