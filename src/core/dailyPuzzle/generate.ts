import { createRandom, type Random } from './random';
import { runBall, simulate, visitsOf } from './simulate';
import type { Aim, Board, Cell, Difficulty, PlacedPart, Puzzle } from './types';

interface Layout {
  width: number;
  height: number;
  useful: number;
  decoys: number;
  aims: number;
}

const LAYOUTS: Record<Difficulty, Layout> = {
  easy: { width: 10, height: 8, useful: 4, decoys: 1, aims: 1 },
  medium: { width: 14, height: 10, useful: 7, decoys: 3, aims: 2 },
  hard: { width: 18, height: 12, useful: 11, decoys: 5, aims: 3 },
};

const PART_KINDS = [
  'ramp-right', 'ramp-left',
  'conveyor-right', 'conveyor-left',
  'trampoline-right', 'trampoline-left',
  'spring-right', 'spring-left',
  'seesaw-right', 'seesaw-left',
  'fan-right', 'fan-left',
];

const AIM_KINDS = ['deliver', 'light', 'flip', 'collect'] as const;

const PART_ATTEMPTS = 40;
const PUZZLE_ATTEMPTS = 200;

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other] as T, result[index] as T];
  }
  return result;
}

function distinct(cells: Cell[]): Cell[] {
  return cells.filter((cell, index) => cells.findIndex((other) => sameCell(other, cell)) === index);
}

function usesEveryPart(board: Board, parts: PlacedPart[]): boolean {
  const { path, landed } = runBall(board, parts);
  return landed && parts.every((part) => visitsOf(path, part.at) > 0);
}

function placeWitness(random: Random, board: Board, layout: Layout): PlacedPart[] | undefined {
  let witness: PlacedPart[] = [];
  let firstIndex = 0;
  for (let count = 0; count < layout.useful; count += 1) {
    const { path } = runBall(board, witness);
    let placed = false;
    for (let attempt = 0; attempt < PART_ATTEMPTS && !placed; attempt += 1) {
      const index = firstIndex + Math.floor(random() * Math.max(1, path.length - firstIndex));
      const cell = path[index];
      if (!cell || cell.y < 0 || cell.y >= board.height - 1) continue;
      if (witness.some((part) => sameCell(part.at, cell))) continue;
      const trial = [...witness, { kind: pick(random, PART_KINDS), at: cell }];
      if (!usesEveryPart(board, trial)) continue;
      witness = trial;
      firstIndex = index + 1;
      placed = true;
    }
    if (!placed) return undefined;
  }
  return witness;
}

function aimsFor(random: Random, path: Cell[], count: number): Aim[] | undefined {
  const end = path[path.length - 1] as Cell;
  const visited = distinct(path);
  const oddlyVisited = visited.filter((cell) => visitsOf(path, cell) % 2 === 1);
  const middle = visited.filter((cell) => !sameCell(cell, end));
  const take = (cells: Cell[]) => shuffled(random, cells).slice(0, 1 + Math.floor(random() * 2));
  const candidates: Record<(typeof AIM_KINDS)[number], Aim | undefined> = {
    deliver: { kind: 'deliver', target: end },
    light: { kind: 'light', candles: take(visited) },
    flip: oddlyVisited.length > 0 ? { kind: 'flip', switches: take(oddlyVisited) } : undefined,
    collect: middle.length > 0 ? { kind: 'collect', stars: take(middle), exit: end } : undefined,
  };
  const chosen = shuffled(random, AIM_KINDS).map((kind) => candidates[kind]).filter((aim): aim is Aim => aim !== undefined);
  return chosen.length >= count ? chosen.slice(0, count) : undefined;
}

function tryBuild(random: Random, layout: Layout): { board: Board; witness: PlacedPart[] } | undefined {
  const start: Cell = { x: Math.floor(random() * layout.width), y: 0 };
  const bare: Board = { width: layout.width, height: layout.height, ballStart: start, aims: [] };
  const witness = placeWitness(random, bare, layout);
  if (!witness) return undefined;
  const aims = aimsFor(random, runBall(bare, witness).path, layout.aims);
  if (!aims) return undefined;
  const board: Board = { ...bare, aims };
  if (simulate(board, []).solved || !simulate(board, witness).solved) return undefined;
  return { board, witness };
}

export function generatePuzzle(seed: string, difficulty: Difficulty): Puzzle {
  const random = createRandom(`${seed}:${difficulty}`);
  const layout = LAYOUTS[difficulty];
  for (let attempt = 0; attempt < PUZZLE_ATTEMPTS; attempt += 1) {
    const built = tryBuild(random, layout);
    if (!built) continue;
    const decoys = Array.from({ length: layout.decoys }, () => pick(random, PART_KINDS));
    const inventory = shuffled(random, [...built.witness.map((part) => part.kind), ...decoys]);
    return { ...built, inventory };
  }
  throw new Error(`no puzzle found for seed ${seed} at ${difficulty}`);
}
