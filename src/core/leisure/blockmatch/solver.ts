import {
  applyClear,
  applyGravity,
  areAdjacent,
  cloneBoard,
  createBoard,
  findMatches,
  hasPossibleMove,
  planClear,
  planTap,
  resolveSwap,
  shuffleBoard,
  swapTiles,
} from './engine';
import { createRng } from './rng';
import type { Board, ClearStats, Goal, Level, Move, Plan, Rng, SolutionStep } from './types';

type State = { board: Board; rng: Rng; remaining: number[] };

const cloneRng = (rng: Rng) => {
  const copy = createRng(0);
  copy.setState(rng.getState());
  return copy;
};

const gainedFor = (goal: Goal, stats: ClearStats) => {
  if (goal.type === 'color') return stats.colors[goal.color] ?? 0;
  if (goal.type === 'box') return stats.boxes;
  return stats.ice;
};

const applyStats = (remaining: number[], goals: Goal[], stats: ClearStats) =>
  remaining.map((left, i) => Math.max(0, left - gainedFor(goals[i]!, stats)));

const runCascade = (board: Board, rng: Rng, firstPlan: Plan, goals: Goal[], remaining: number[]) => {
  let plan: Plan | null = firstPlan;
  let left = remaining;
  while (plan) {
    left = applyStats(left, goals, applyClear(board, plan));
    applyGravity(board, rng);
    const groups = findMatches(board);
    plan = groups.length ? planClear(board, { groups }) : null;
  }
  if (!hasPossibleMove(board)) shuffleBoard(board, rng);
  return left;
};

const listMoves = (board: Board) => {
  const moves: Move[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const tile = board.tiles[r]![c];
      if (!tile) continue;
      if (tile.special) moves.push({ from: { r, c }, to: null });
      for (const to of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (!board.tiles[to.r]?.[to.c] || !areAdjacent({ r, c }, to)) continue;
        moves.push({ from: { r, c }, to });
      }
    }
  }
  return moves;
};

const tryMove = (state: State, move: Move, level: Level): State | null => {
  const { goals } = level;
  const board = cloneBoard(state.board);
  const rng = cloneRng(state.rng);
  let plan: Plan | null;
  if (!move.to) {
    plan = planTap(board, move.from);
  } else {
    swapTiles(board, move.from, move.to);
    plan = resolveSwap(board, move.from, move.to, rng);
  }
  if (!plan) return null;
  const remaining = runCascade(board, rng, plan, goals, state.remaining);
  return { board, rng, remaining };
};

const progressOf = (remaining: number[], goals: Goal[]) =>
  remaining.reduce((sum, left, i) => sum + left / (goals[i]!.type === 'color' ? 1 : 1.5), 0);

const countSpecials = (board: Board) => board.tiles.flat().filter((tile) => tile?.special).length;

const score = (state: State, goals: Goal[]) => -progressOf(state.remaining, goals) * 10 + countSpecials(state.board);

const bestMove = (state: State, level: Level) => {
  const { goals } = level;
  let best: { value: number; next: State; move: Move } | null = null;
  for (const move of listMoves(state.board)) {
    const next = tryMove(state, move, level);
    if (!next) continue;
    const value = score(next, goals);
    if (!best || value > best.value) best = { value, next, move };
  }
  return best;
};

// Plays a greedy bot with the exact engine and seeded rng: the returned steps are a sequence
// for which a win is known to exist.
export const solveFrom = (level: Level, board: Board, rng: Rng, remaining: number[], maxMoves: number): SolutionStep[] | null => {
  let state: State = { board: cloneBoard(board), rng: cloneRng(rng), remaining };
  const steps: SolutionStep[] = [];
  while (steps.length < maxMoves) {
    const best = bestMove(state, level);
    if (!best) return null;
    steps.push({ move: best.move, board: state.board });
    state = best.next;
    if (state.remaining.every((left) => left === 0)) return steps;
  }
  return null;
};

export const solve = (level: Level, maxMoves: number): number | null => {
  const { board, rng } = createBoard(level);
  const steps = solveFrom(level, board, rng, level.goals.map((goal) => goal.target), maxMoves);
  return steps?.length ?? null;
};
