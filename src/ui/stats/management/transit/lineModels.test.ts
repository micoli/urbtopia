import { describe, expect, it } from 'vitest';
import { newGame } from '../../../../core';
import { linesServing } from './lineModels';

const game = { ...newGame({ seed: 'lines', now: 0 }), busLines: [{ id: 10, stops: [1, 2] }, { id: 11, stops: [2, 3] }], transitLines: [{ id: 12, mode: 'rail' as const, stops: [2, 4], peakHeadway: 5, offPeakHeadway: 12 }] };

describe('linesServing', () => {
  it('lists every bus and transit line that calls at the stop', () => {
    expect(linesServing(game, 2)).toEqual([10, 11, 12]);
    expect(linesServing(game, 4)).toEqual([12]);
  });

  it('lists none for a stop outside any line', () => {
    expect(linesServing(game, 99)).toEqual([]);
  });
});
