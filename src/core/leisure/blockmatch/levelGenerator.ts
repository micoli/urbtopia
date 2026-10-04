import type { Goal, Grid, Level, Rng } from './types';
import { createGrid, setMirrored } from './grid';
import { hashSeed } from '../../engine/random';
import { createRng } from './rng';
import { minMovesForThreeStars } from './scoring';
import { solve } from './solver';

const DIFFICULTY_RAMP = 60;
const MAX_GOALS = 3;
const MAX_SOLVER_MOVES = 28;
const MAX_MOVES = 45;
const MIN_COLOR_TARGET = 5;
const COLOR_TARGET_STEP = 5;
const HUMAN_MARGIN = 1.5;
const HUMAN_EXTRA_MOVES = 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundTo5 = (value: number) => Math.max(5, Math.round(value / 5) * 5);
const countCells = (grid: Grid<number>) => grid.flat().filter((value) => value > 0).length;
const sumCells = (grid: Grid<number>) => grid.flat().reduce((sum, value) => sum + value, 0);

const carveShape = (rng: Rng, rows: number, cols: number, number: number) => {
  const holes = createGrid(rows, cols, false);
  if (number < 3 || !rng.chance(0.55)) return holes;

  const pattern = rng.pick(['corners', 'topNotch', 'bottomNotch', 'pillars']);
  const half = Math.ceil(cols / 2);

  if (pattern === 'corners') {
    const size = rng.int(1, 2);
    const bottom = rng.chance(0.5);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        setMirrored(holes, i, j, true);
        if (bottom) setMirrored(holes, rows - 1 - i, j, true);
      }
    }
    return holes;
  }

  if (pattern === 'pillars') {
    const count = rng.int(1, 2);
    for (let i = 0; i < count; i++) setMirrored(holes, rng.int(2, rows - 3), rng.int(1, half - 1), true);
    return holes;
  }

  const depth = rng.int(1, 2);
  const width = rng.int(1, 2);
  const center = Math.floor((cols - 1) / 2);
  for (let d = 0; d < depth; d++) {
    const row = pattern === 'topNotch' ? d : rows - 1 - d;
    for (let w = 0; w < width; w++) setMirrored(holes, row, center - w, true);
  }
  return holes;
};

const placeBoxes = (rng: Rng, holes: Grid<boolean>, rows: number, cols: number, number: number, difficulty: number) => {
  const boxes = createGrid(rows, cols, 0);
  if (number < 3 || !rng.chance(0.5 + difficulty * 0.4)) return boxes;

  const strongChance = 0.1 + difficulty * 0.6;
  const half = Math.ceil(cols / 2);
  const place = (r: number, c: number) => {
    if (holes[r]![c] || holes[r]![cols - 1 - c]) return;
    setMirrored(boxes, r, c, rng.chance(strongChance) ? 2 : 1);
  };

  if (rng.chance(0.5)) {
    const depth = rng.int(1, 1 + Math.round(difficulty * 2));
    const margin = rng.int(0, 2);
    for (let d = 0; d < depth; d++) {
      for (let c = margin; c < half; c++) place(rows - 1 - d, c);
    }
    return boxes;
  }

  const count = rng.int(2, 3 + Math.round(difficulty * 6));
  for (let i = 0; i < count; i++) place(rng.int(3, rows - 1), rng.int(0, half - 1));
  return boxes;
};

const placeIce = (
  rng: Rng,
  holes: Grid<boolean>,
  boxes: Grid<number>,
  rows: number,
  cols: number,
  number: number,
  difficulty: number,
) => {
  const ice = createGrid(rows, cols, 0);
  if (number < 5 || !rng.chance(0.35 + difficulty * 0.35)) return ice;

  const half = Math.ceil(cols / 2);
  const height = rng.int(2, 3 + Math.round(difficulty * 2));
  const width = rng.int(1, half);
  const top = rng.int(1, rows - height);
  const layers = rng.chance(0.1 + difficulty * 0.5) ? 2 : 1;
  const isFree = (r: number, c: number) => !holes[r]![c] && boxes[r]![c] === 0;

  for (let r = top; r < top + height; r++) {
    for (let c = half - width; c < half; c++) {
      if (isFree(r, c) && isFree(r, cols - 1 - c)) setMirrored(ice, r, c, layers);
    }
  }
  return ice;
};

const buildGoals = (rng: Rng, colors: number, boxes: Grid<number>, ice: Grid<number>, difficulty: number) => {
  const goals: Goal[] = [];
  const boxCount = countCells(boxes);
  const iceCount = countCells(ice);
  if (boxCount) goals.push({ type: 'box', target: boxCount });
  if (iceCount) goals.push({ type: 'ice', target: iceCount });

  const colorGoals = Math.min(MAX_GOALS - goals.length, rng.int(goals.length ? 0 : 1, 2));
  const palette = rng.shuffle(Array.from({ length: colors }, (_, i) => i));
  for (let i = 0; i < colorGoals; i++) {
    goals.push({ type: 'color', color: palette[i]!, target: roundTo5(8 + difficulty * 30 + rng.int(0, 10)) });
  }
  return goals;
};

const computeMoves = (goals: Goal[], boxes: Grid<number>, ice: Grid<number>, colors: number, difficulty: number) => {
  const colorRate = colors <= 4 ? 3 : colors === 5 ? 2.4 : 1.9;
  const effort = goals.reduce((sum, goal) => {
    if (goal.type === 'color') return sum + goal.target / colorRate;
    if (goal.type === 'box') return sum + sumCells(boxes) / 1.3;
    return sum + sumCells(ice) / 2.6;
  }, 0);
  const slack = 1.05 - difficulty * 0.35;
  return clamp(Math.round(effort * slack + 3), 10, 40);
};

const mapGrid = <T, U>(grid: Grid<T>, fn: (value: T) => U) => grid.map((row) => row.map(fn));

const syncGoalTargets = (goals: Goal[], boxes: Grid<number>, ice: Grid<number>) =>
  goals
    .map((goal): Goal => {
      if (goal.type === 'box') return { ...goal, target: countCells(boxes) };
      if (goal.type === 'ice') return { ...goal, target: countCells(ice) };
      return goal;
    })
    .filter((goal) => goal.type === 'color' || goal.target > 0);

const lowerColorTargets = (goals: Goal[]) => {
  const colorGoals = goals.filter((goal) => goal.type === 'color');
  if (!colorGoals.some((goal) => goal.target > MIN_COLOR_TARGET)) return null;
  return goals.map((goal): Goal =>
    goal.type === 'color' ? { ...goal, target: Math.max(MIN_COLOR_TARGET, goal.target - COLOR_TARGET_STEP) } : goal,
  );
};

const halve = (grid: Grid<number>) => {
  let kept = 0;
  return mapGrid(grid, (value) => {
    if (value === 0) return 0;
    return kept++ % 2 === 0 ? value : 0;
  });
};

const easeLevel = (level: Level): Level => {
  const lowered = lowerColorTargets(level.goals);
  if (lowered) return { ...level, goals: lowered };

  const hasStrong = level.boxes.flat().some((v) => v > 1) || level.ice.flat().some((v) => v > 1);
  const boxes = hasStrong ? mapGrid(level.boxes, (v) => Math.min(1, v)) : halve(level.boxes);
  const ice = hasStrong ? mapGrid(level.ice, (v) => Math.min(1, v)) : halve(level.ice);
  const goals = syncGoalTargets(level.goals, boxes, ice);
  if (goals.length) return { ...level, boxes, ice, goals };
  return { ...level, boxes, ice, goals: [{ type: 'color', color: 0, target: MIN_COLOR_TARGET * 2 }] };
};

const humanBudget = (solverMoves: number) => Math.ceil(solverMoves * HUMAN_MARGIN) + HUMAN_EXTRA_MOVES;

// Guarantees winnability: a bot plays the real engine with the level's seeded rng, so a
// winning sequence within the returned budget is known to exist.
// In try hard mode the budget also leaves enough spare moves after the bot's win for three stars.
const withWinnableBudget = (level: Level, tryHard: boolean): Level => {
  let current = level;
  for (;;) {
    const solverMoves = solve(current, MAX_SOLVER_MOVES);
    if (solverMoves !== null) {
      const budget = Math.max(current.moves, humanBudget(solverMoves));
      const moves = tryHard ? Math.max(budget, minMovesForThreeStars(solverMoves)) : Math.min(MAX_MOVES, budget);
      if (moves <= MAX_MOVES) return { ...current, moves };
    }
    current = easeLevel(current);
  }
};

export const generateLevel = (seed: string, number: number, tryHard = false): Level => {
  const rng = createRng(hashSeed(`${seed}:level:${number}`));
  const difficulty = Math.min(1, (number - 1) / DIFFICULTY_RAMP);
  const cols = number <= 3 ? 7 : rng.int(7, 9);
  const rows = number <= 3 ? 8 : rng.int(8, 9);
  const colors = number <= 4 ? 4 : rng.chance(difficulty * 0.3) ? 6 : 5;

  const holes = carveShape(rng, rows, cols, number);
  const boxes = placeBoxes(rng, holes, rows, cols, number, difficulty);
  const ice = placeIce(rng, holes, boxes, rows, cols, number, difficulty);
  const goals = buildGoals(rng, colors, boxes, ice, difficulty);

  const level: Level = {
    seed,
    number,
    difficulty,
    rows,
    cols,
    colors,
    holes,
    boxes,
    ice,
    goals,
    moves: computeMoves(goals, boxes, ice, colors, difficulty),
    tileSeed: hashSeed(`${seed}:tiles:${number}`),
  };
  return withWinnableBudget(level, tryHard);
};
