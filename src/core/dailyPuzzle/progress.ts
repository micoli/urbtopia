import type { Board, Cell, PlacedPart, Trajectory } from './types';

export interface Progress {
  litCandles: Cell[];
  activeSwitches: Cell[];
  takenStars: Cell[];
  seesawTurns: Record<string, number>;
}

export const cellKey = (cell: Cell) => `${cell.x},${cell.y}`;

// The ball at a moment, between the two samples it lies between.
export function ballAt(trajectory: Trajectory, time: number): { x: number; y: number } {
  const last = trajectory.xs.length - 1;
  const position = Math.min(last, Math.max(0, time / trajectory.step));
  const before = Math.floor(position);
  const after = Math.min(last, before + 1);
  const share = position - before;
  const lerp = (values: number[]) => (values[before] as number) + ((values[after] as number) - (values[before] as number)) * share;
  return { x: lerp(trajectory.xs), y: lerp(trajectory.ys) };
}

/** What the ball has lit, switched on, taken and turned over by `time`. */
export function progressAt(board: Board, parts: PlacedPart[], trajectory: Trajectory, time: number): Progress {
  const done = trajectory.events.filter((event) => event.t <= time);
  const entries = (cell: Cell) => done.filter((event) => event.kind === 'enter' && event.cell.x === cell.x && event.cell.y === cell.y).length;
  const progress: Progress = { litCandles: [], activeSwitches: [], takenStars: [], seesawTurns: {} };
  for (const aim of board.aims) {
    if (aim.kind === 'light') progress.litCandles.push(...aim.candles.filter((candle) => entries(candle) > 0));
    if (aim.kind === 'flip') progress.activeSwitches.push(...aim.switches.filter((cell) => entries(cell) % 2 === 1));
    if (aim.kind === 'collect') progress.takenStars.push(...aim.stars.filter((star) => entries(star) > 0));
  }
  for (const part of parts.filter(({ kind }) => kind.startsWith('seesaw-'))) {
    const turns = done.filter((event) => event.kind === 'flip' && event.cell.x === part.at.x && event.cell.y === part.at.y).length;
    if (turns > 0) progress.seesawTurns[cellKey(part.at)] = turns;
  }
  return progress;
}

// The run before it starts: the ball where it is dropped, nothing has happened.
export function restingTrajectory(board: Board): Trajectory {
  return { step: 1 / 60, xs: [board.ballStart.x + 0.5], ys: [board.ballStart.y + 0.5], events: [], landed: false, landing: undefined, crossing: undefined };
}
