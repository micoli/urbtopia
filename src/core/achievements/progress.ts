import type { GameState } from '../engine/state';
import { ACHIEVEMENTS, achievementsOf } from './achievements';
import { ACHIEVEMENT_CATEGORIES, type AchievementCategoryId } from './achievementTypes';
import { isAvailable } from './availability';
import { isAcquired } from './latch';

export interface CategoryProgress {
  readonly category: AchievementCategoryId;
  readonly acquired: number;
  readonly total: number;
  readonly complete: boolean;
}

// `flags` holds the beta features the player switched on.
export function categoryProgress(state: GameState, category: AchievementCategoryId, flags: ReadonlySet<string>): CategoryProgress {
  const possible = achievementsOf(category).filter((achievement) => isAvailable(state, achievement, flags));
  const acquired = possible.filter((achievement) => isAcquired(state, achievement.id)).length;
  return { category, acquired, total: possible.length, complete: possible.length > 0 && acquired === possible.length };
}

// A category with no possible Achievement is hidden.
export function visibleCategories(state: GameState, flags: ReadonlySet<string>): CategoryProgress[] {
  return ACHIEVEMENT_CATEGORIES.map((category) => categoryProgress(state, category, flags)).filter((progress) => progress.total > 0);
}

export function completedCategories(state: GameState, flags: ReadonlySet<string>): AchievementCategoryId[] {
  return ACHIEVEMENT_CATEGORIES.filter((category) => categoryProgress(state, category, flags).complete);
}

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;
