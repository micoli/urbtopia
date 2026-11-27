import { createRandom, type Random } from './random';
import { PHYSICS, runBall, simulate } from './simulate';
import type { Aim, Board, Cell, Difficulty, PlacedPart, Puzzle, Trajectory } from './types';

interface Layout {
  width: number;
  height: number;
  useful: number;
  decoys: number;
  aims: number;
}

const LAYOUTS: Record<Difficulty, Layout> = {
  easy: { width: 10, height: 8, useful: 4, decoys: 3, aims: 1 },
  medium: { width: 14, height: 10, useful: 7, decoys: 5, aims: 2 },
  hard: { width: 18, height: 12, useful: 11, decoys: 8, aims: 3 },
};

const PART_KINDS = [
  'ramp-right', 'ramp-left',
  'conveyor-right', 'conveyor-left',
  'trampoline-right', 'trampoline-left',
  'spring-right', 'spring-left',
  'seesaw-right', 'seesaw-left',
  'fan-right', 'fan-left',
];


const PART_ATTEMPTS = 40;
const PUZZLE_ATTEMPTS = 2000;

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

interface Visit {
  cell: Cell;
  t: number;
}

// The cells the centre of the ball goes through, in the order it first reaches them, with the moment.
function visitsOf(trajectory: Trajectory): Visit[] {
  const seen = new Set<string>();
  const visits: Visit[] = [];
  trajectory.xs.forEach((x, index) => {
    const cell = { x: Math.floor(x), y: Math.floor(trajectory.ys[index] as number) };
    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) return;
    seen.add(key);
    visits.push({ cell, t: index * trajectory.step });
  });
  return visits;
}

// How many times the ball goes into the zone of each cell it passes close to the centre of: what a candle, a switch or a star would see.
function zoneEntries(trajectory: Trajectory): Map<string, number> {
  const entries = new Map<string, number>();
  let inside = '';
  trajectory.xs.forEach((x, index) => {
    const y = trajectory.ys[index] as number;
    const cell = { x: Math.floor(x), y: Math.floor(y) };
    const near = Math.hypot(x - (cell.x + 0.5), y - (cell.y + 0.5)) <= PHYSICS.enterRadius;
    const key = near ? `${cell.x},${cell.y}` : '';
    if (key !== '' && key !== inside) entries.set(key, (entries.get(key) ?? 0) + 1);
    inside = key;
  });
  return entries;
}

const cellOfKey = (key: string): Cell => {
  const [x, y] = key.split(',').map(Number);
  return { x: x as number, y: y as number };
};

// When the ball first touches a Part, rides it or is blown by it.
function firstContact(trajectory: Trajectory, part: PlacedPart): number | undefined {
  const touches = trajectory.events.filter((event) => ['hit', 'belt', 'jet'].includes(event.kind) && sameCell(event.cell, part.at));
  return touches.length > 0 ? Math.min(...touches.map((event) => event.t)) : undefined;
}

// The ball has to get to the bottom of the board, where a target will catch it, after touching every Part.
const usesEveryPart = (parts: PlacedPart[], trajectory: Trajectory): boolean => trajectory.crossing !== undefined && parts.every((part) => firstContact(trajectory, part) !== undefined);

function placeWitness(random: Random, board: Board, layout: Layout): PlacedPart[] | undefined {
  let witness: PlacedPart[] = [];
  let after = 0;
  for (let count = 0; count < layout.useful; count += 1) {
    const candidates = visitsOf(runBall(board, witness)).filter(
      (visit) => visit.t >= after && visit.cell.y >= 0 && visit.cell.y <= board.height - 2 && !sameCell(visit.cell, board.ballStart) && !witness.some((part) => sameCell(part.at, visit.cell)),
    );
    let placed = false;
    for (let attempt = 0; attempt < PART_ATTEMPTS && candidates.length > 0 && !placed; attempt += 1) {
      const visit = pick(random, candidates);
      const part = { kind: pick(random, PART_KINDS), at: visit.cell };
      const trial = [...witness, part];
      const trajectory = runBall(board, trial);
      if (!usesEveryPart(trial, trajectory)) continue;
      witness = trial;
      after = firstContact(trajectory, part) ?? visit.t;
      placed = true;
    }
    if (!placed) return undefined;
  }
  return witness;
}

/**
 * The Aims of a puzzle, drawn from the trajectory the witness makes. The elements of an Aim (candles, switches, stars) stay clear of the cells of the witness Parts, of the start of the ball and of one
 * another, so that the witness can be placed by the rules of the editor, which keep a Part off every element.
 */
function aimsFor(random: Random, trajectory: Trajectory, count: number, blocked: Cell[], target: Cell, height: number): Aim[] | undefined {
  const taken = [...blocked, target];
  const entries = zoneEntries(trajectory);
  const cellsWhere = (test: (count: number) => boolean) => [...entries].filter(([, times]) => test(times)).map(([key]) => cellOfKey(key));
  const onBoard = (cell: Cell) => cell.y >= 0 && cell.y < height && cell.x >= 0;
  const open = (cells: Cell[]) => cells.filter((cell) => onBoard(cell) && !taken.some((other) => sameCell(other, cell)));
  const take = (cells: Cell[]): Cell[] | undefined => {
    const pool = open(cells);
    if (pool.length === 0) return undefined;
    const chosen = shuffled(random, pool).slice(0, 1 + Math.floor(random() * 2));
    taken.push(...chosen);
    return chosen;
  };
  const make: Record<Aim['kind'], () => Aim | undefined> = {
    deliver: () => ({ kind: 'deliver', target }),
    light: () => {
      const candles = take(cellsWhere((times) => times > 0));
      return candles && { kind: 'light', candles };
    },
    flip: () => {
      const switches = take(cellsWhere((times) => times % 2 === 1));
      return switches && { kind: 'flip', switches };
    },
    collect: () => {
      const stars = take(cellsWhere((times) => times > 0));
      return stars && { kind: 'collect', stars, exit: target };
    },
  };
  // The bottom of the board is a void: a puzzle always has a target to catch the ball, the cup of a Deliver or the exit of a Collect, and the other Aims come on top of it.
  const chosen: Aim[] = [];
  for (const kind of shuffled(random, ['deliver', 'collect'] as const)) {
    const aim = make[kind]();
    if (aim) {
      chosen.push(aim);
      break;
    }
  }
  for (const kind of shuffled(random, ['light', 'flip'] as const)) {
    const aim = chosen.length < count ? make[kind]() : undefined;
    if (aim) chosen.push(aim);
  }
  return chosen.length >= count ? chosen : undefined;
}

function needsEveryPart(board: Board, witness: PlacedPart[]): boolean {
  return witness.every((_, skipped) => !simulate(board, witness.filter((__, kept) => kept !== skipped)).solved);
}

function tryBuild(random: Random, layout: Layout): { board: Board; witness: PlacedPart[] } | undefined {
  const start: Cell = { x: Math.floor(random() * layout.width), y: 0 };
  const bare: Board = { width: layout.width, height: layout.height, ballStart: start, aims: [] };
  const witness = placeWitness(random, bare, layout);
  if (!witness) return undefined;
  const trajectory = runBall(bare, witness);
  const crossing = trajectory.crossing;
  if (!crossing) return undefined;
  // The target stands where the ball reaches the bottom, and only if it comes down close enough to the middle of its cup.
  const target = { x: Math.min(layout.width - 1, Math.max(0, Math.floor(crossing.x))), y: layout.height - 1 };
  if (Math.abs(crossing.x - (target.x + 0.5)) > 0.25) return undefined;
  const aims = aimsFor(random, trajectory, layout.aims, [start, ...witness.map((part) => part.at)], target, layout.height);
  if (!aims) return undefined;
  const board: Board = { ...bare, aims };
  if (simulate(board, []).solved || !simulate(board, witness).solved || !needsEveryPart(board, witness)) return undefined;
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
