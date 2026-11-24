import { describe, expect, it } from 'vitest';
import { progressAt } from './progress';
import { runBall } from './simulate';
import type { Aim, Board, PlacedPart } from './types';

function boardWith(aim: Aim): Board {
  return { width: 5, height: 6, ballStart: { x: 2, y: 0 }, aims: [aim] };
}

function progress(board: Board, parts: PlacedPart[], tick: number) {
  return progressAt(board, parts, runBall(board, parts).path, tick);
}

describe('progressAt', () => {
  it('shows a bare board before the ball has moved', () => {
    const board = boardWith({ kind: 'light', candles: [{ x: 2, y: 3 }] });

    expect(progress(board, [], 0)).toEqual({ litCandles: [], activeSwitches: [], takenStars: [], seesawTurns: {} });
  });

  it('lights a candle once the ball has passed through it', () => {
    const board = boardWith({ kind: 'light', candles: [{ x: 2, y: 1 }, { x: 2, y: 3 }] });

    expect(progress(board, [], 2).litCandles).toEqual([{ x: 2, y: 1 }]);
    expect(progress(board, [], 3).litCandles).toEqual([{ x: 2, y: 1 }, { x: 2, y: 3 }]);
  });

  it('keeps a switch active while the ball has crossed it an odd number of times', () => {
    const board = boardWith({ kind: 'flip', switches: [{ x: 3, y: 3 }, { x: 2, y: 1 }] });
    const parts = [
      { kind: 'seesaw-right', at: { x: 2, y: 2 } },
      { kind: 'trampoline-left', at: { x: 3, y: 4 } },
    ];

    expect(progress(board, parts, 3).activeSwitches).toEqual([{ x: 3, y: 3 }, { x: 2, y: 1 }]);
    expect(progress(board, parts, 6).activeSwitches).toEqual([{ x: 3, y: 3 }]);
  });

  it('takes a star when the ball goes through it', () => {
    const board = boardWith({ kind: 'collect', stars: [{ x: 2, y: 2 }, { x: 4, y: 2 }], exit: { x: 2, y: 5 } });

    expect(progress(board, [], 1).takenStars).toEqual([]);
    expect(progress(board, [], 2).takenStars).toEqual([{ x: 2, y: 2 }]);
  });

  it('counts how many times the ball has crossed each seesaw', () => {
    const board = boardWith({ kind: 'deliver', target: { x: 1, y: 5 } });
    const parts = [
      { kind: 'seesaw-right', at: { x: 2, y: 2 } },
      { kind: 'trampoline-left', at: { x: 3, y: 4 } },
    ];

    expect(progress(board, parts, 2).seesawTurns).toEqual({ '2,2': 1 });
    expect(progress(board, parts, 6).seesawTurns).toEqual({ '2,2': 2 });
  });
});
