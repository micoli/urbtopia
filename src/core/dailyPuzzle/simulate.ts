import type { Board, Cell, PlacedPart, SimulationResult } from './types';

export const MAX_TICKS = 200;

const FALL = { dx: 0, dy: 1 };

const MOVES: Record<string, { dx: number; dy: number }> = {
  'ramp-right': { dx: 1, dy: 1 },
  'conveyor-right': { dx: 1, dy: 0 },
  'conveyor-left': { dx: -1, dy: 0 },
  'trampoline-right': { dx: 1, dy: -3 },
  'spring-right': { dx: 3, dy: -1 },
};

function partAt(parts: PlacedPart[], cell: Cell): PlacedPart | undefined {
  return parts.find((part) => part.at.x === cell.x && part.at.y === cell.y);
}

function nextCell(ball: Cell, parts: PlacedPart[]): Cell {
  const part = partAt(parts, ball);
  const move = (part && MOVES[part.kind]) ?? FALL;
  return { x: ball.x + move.dx, y: ball.y + move.dy };
}

export function simulate(board: Board, parts: PlacedPart[]): SimulationResult {
  let ball = board.ballStart;
  let ticks = 0;
  while (ball.y < board.height - 1 && ticks < MAX_TICKS) {
    ball = nextCell(ball, parts);
    ticks += 1;
  }
  const landed = ticks < MAX_TICKS;
  const reached = board.aims.every((aim) => aim.target.x === ball.x && aim.target.y === ball.y);
  return { solved: landed && reached, ticks };
}
