import type { Board, Cell, PlacedPart, SimulationResult } from './types';

export const MAX_TICKS = 200;

interface Move {
  dx: number;
  dy: number;
}

const FALL: Move = { dx: 0, dy: 1 };

const MOVES: Record<string, Move> = {
  'ramp-right': { dx: 1, dy: 1 },
  'conveyor-right': { dx: 1, dy: 0 },
  'conveyor-left': { dx: -1, dy: 0 },
  'trampoline-right': { dx: 1, dy: -3 },
  'trampoline-left': { dx: -1, dy: -3 },
  'spring-right': { dx: 3, dy: -1 },
};

const SEESAW_SIDE: Record<string, number> = { 'seesaw-right': 1, 'seesaw-left': -1 };

const FAN_SIDE: Record<string, number> = { 'fan-right': 1, 'fan-left': -1 };
const FAN_REACH = 3;
const FAN_PUSH = 2;

const cellKey = (cell: Cell) => `${cell.x},${cell.y}`;

export function simulate(board: Board, parts: PlacedPart[]): SimulationResult {
  const partByCell = new Map(parts.map((part) => [cellKey(part.at), part.kind]));
  const seesawSide = new Map<string, number>();

  function jetPush(ball: Cell): Move | undefined {
    for (const part of parts) {
      const side = FAN_SIDE[part.kind];
      if (side === undefined || part.at.y !== ball.y) continue;
      const distance = (ball.x - part.at.x) * side;
      if (distance >= 0 && distance < FAN_REACH) return { dx: FAN_PUSH * side, dy: 1 };
    }
    return undefined;
  }

  function moveFrom(ball: Cell): Move {
    const key = cellKey(ball);
    const kind = partByCell.get(key);
    if (kind === undefined || FAN_SIDE[kind] !== undefined) return jetPush(ball) ?? FALL;
    const initialSide = SEESAW_SIDE[kind];
    if (initialSide === undefined) return MOVES[kind] ?? FALL;
    const side = seesawSide.get(key) ?? initialSide;
    seesawSide.set(key, -side);
    return { dx: side, dy: 1 };
  }

  let ball = board.ballStart;
  let ticks = 0;
  while (ball.y < board.height - 1 && ticks < MAX_TICKS) {
    const move = moveFrom(ball);
    ball = { x: ball.x + move.dx, y: ball.y + move.dy };
    ticks += 1;
  }
  const landed = ticks < MAX_TICKS;
  const reached = board.aims.every((aim) => aim.target.x === ball.x && aim.target.y === ball.y);
  return { solved: landed && reached, ticks };
}
