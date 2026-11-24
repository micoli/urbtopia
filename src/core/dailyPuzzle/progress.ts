import { visitsOf } from './simulate';
import type { Board, Cell, PlacedPart } from './types';

export interface Progress {
  litCandles: Cell[];
  activeSwitches: Cell[];
  takenStars: Cell[];
  seesawTurns: Record<string, number>;
}

export const cellKey = (cell: Cell) => `${cell.x},${cell.y}`;

export function progressAt(board: Board, parts: PlacedPart[], path: Cell[], tick: number): Progress {
  const walked = path.slice(0, tick + 1);
  const progress: Progress = { litCandles: [], activeSwitches: [], takenStars: [], seesawTurns: {} };
  for (const aim of board.aims) {
    if (aim.kind === 'light') progress.litCandles.push(...aim.candles.filter((candle) => visitsOf(walked, candle) > 0));
    if (aim.kind === 'flip') progress.activeSwitches.push(...aim.switches.filter((cell) => visitsOf(walked, cell) % 2 === 1));
    if (aim.kind === 'collect') progress.takenStars.push(...aim.stars.filter((star) => visitsOf(walked, star) > 0));
  }
  for (const part of parts.filter(({ kind }) => kind.startsWith('seesaw-'))) {
    const turns = visitsOf(walked, part.at);
    if (turns > 0) progress.seesawTurns[cellKey(part.at)] = turns;
  }
  return progress;
}
