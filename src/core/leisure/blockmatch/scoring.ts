import type { ClearStats } from './types';

const POINTS_PER_TILE = 10;
const POINTS_PER_STRUCTURE = 30;
const POINTS_PER_REMAINING_MOVE = 300;

export const THREE_STARS_MIN_MOVES_LEFT_RATIO = 0.3;

export const minMovesForThreeStars = (winningMoves: number) => {
  let moves = winningMoves;
  while ((moves - winningMoves) / moves < THREE_STARS_MIN_MOVES_LEFT_RATIO) moves++;
  return moves;
};

export const clearPoints = (clearedCount: number, chain: number, stats: Pick<ClearStats, 'boxes' | 'ice'>) =>
  clearedCount * POINTS_PER_TILE * chain + (stats.boxes + stats.ice) * POINTS_PER_STRUCTURE;

export const remainingMovePoints = () => POINTS_PER_REMAINING_MOVE;
