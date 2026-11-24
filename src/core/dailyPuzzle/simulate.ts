import type { Board, Cell, PlacedPart, SimulationResult } from './types';

function partAt(parts: PlacedPart[], cell: Cell): PlacedPart | undefined {
  return parts.find((part) => part.at.x === cell.x && part.at.y === cell.y);
}

function nextCell(ball: Cell, parts: PlacedPart[]): Cell {
  if (partAt(parts, ball)?.kind === 'ramp-right') return { x: ball.x + 1, y: ball.y + 1 };
  return { x: ball.x, y: ball.y + 1 };
}

export function simulate(board: Board, parts: PlacedPart[]): SimulationResult {
  let ball = board.ballStart;
  let ticks = 0;
  while (ball.y < board.height - 1) {
    ball = nextCell(ball, parts);
    ticks += 1;
  }
  const reached = board.aims.every((aim) => aim.target.x === ball.x && aim.target.y === ball.y);
  return { solved: reached, ticks };
}
