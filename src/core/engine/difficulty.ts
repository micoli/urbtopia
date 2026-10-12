import type { GameState } from './state';

export const DIFFICULTIES = ['cozy', 'easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_DIFFICULTY: Difficulty = 'cozy';

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

export function difficultyOf(state: GameState): Difficulty {
  return state.difficulty ?? DEFAULT_DIFFICULTY;
}
