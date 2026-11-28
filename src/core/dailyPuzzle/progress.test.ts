import { describe, expect, it } from 'vitest';
import { progressAt } from './progress';
import { runBall } from './simulate';
import type { Aim, Board, PlacedPart } from './types';

function boardWith(aim: Aim): Board {
  return { width: 8, height: 8, ballStart: { x: 3, y: 0 }, aims: [aim] };
}

function progress(board: Board, parts: PlacedPart[], time: number) {
  return progressAt(board, parts, runBall(board, parts), time);
}

const enters = (board: Board, parts: PlacedPart[]) => runBall(board, parts).events.filter((event) => event.kind === 'enter').map((event) => event.t);

describe('progressAt', () => {
  it('shows a bare board before the ball has reached anything', () => {
    const board = boardWith({ kind: 'light', candles: [{ x: 3, y: 4 }] });

    expect(progress(board, [], 0)).toEqual({ litCandles: [], activeSwitches: [], takenStars: [], seesawTurns: {} });
  });

  it('lights a candle from the moment the ball goes into it', () => {
    const board = boardWith({ kind: 'light', candles: [{ x: 3, y: 2 }, { x: 3, y: 5 }] });
    const [first, second] = enters(board, []) as [number, number];

    expect(progress(board, [], first - 0.01).litCandles).toEqual([]);
    expect(progress(board, [], first + 0.01).litCandles).toEqual([{ x: 3, y: 2 }]);
    expect(progress(board, [], second + 0.01).litCandles).toEqual([{ x: 3, y: 2 }, { x: 3, y: 5 }]);
  });

  it('keeps a switch active while the ball has gone into it an odd number of times', () => {
    const board = boardWith({ kind: 'flip', switches: [{ x: 3, y: 3 }] });
    const parts = [{ kind: 'trampoline-right', at: { x: 3, y: 6 } }];
    const [first, second] = enters(board, parts) as [number, number];

    expect(progress(board, parts, first + 0.01).activeSwitches).toEqual([{ x: 3, y: 3 }]);
    expect(progress(board, parts, second + 0.01).activeSwitches).toEqual([]);
  });

  it('takes a star when the ball goes through it', () => {
    const board = boardWith({ kind: 'collect', stars: [{ x: 3, y: 3 }, { x: 6, y: 3 }], exit: { x: 3, y: 7 } });
    const [first] = enters(board, []) as [number];

    expect(progress(board, [], first - 0.01).takenStars).toEqual([]);
    expect(progress(board, [], first + 0.01).takenStars).toEqual([{ x: 3, y: 3 }]);
  });

  it('counts how many times each seesaw has turned over', () => {
    const board = boardWith({ kind: 'deliver', target: { x: 5, y: 7 } });
    const parts = [{ kind: 'seesaw-right', at: { x: 3, y: 3 } }];
    const [flip] = runBall(board, parts).events.filter((event) => event.kind === 'flip');

    expect(progress(board, parts, (flip?.t ?? 0) - 0.01).seesawTurns).toEqual({});
    expect(progress(board, parts, (flip?.t ?? 0) + 0.01).seesawTurns).toEqual({ '3,3': 1 });
  });
});
