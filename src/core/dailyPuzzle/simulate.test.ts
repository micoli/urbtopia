import { describe, expect, it } from 'vitest';
import { MAX_TICKS, simulate } from './simulate';
import type { Board, Cell } from './types';

const emptyBoard: Board = {
  width: 5,
  height: 6,
  ballStart: { x: 2, y: 0 },
  aims: [{ kind: 'deliver', target: { x: 2, y: 5 } }],
};

describe('simulate', () => {
  it('solves a Deliver aim when the ball falls straight into the target', () => {
    const result = simulate(emptyBoard, []);

    expect(result.solved).toBe(true);
  });

  it('fails when the ball falls beside the target', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 } };

    expect(simulate(board, []).solved).toBe(false);
  });

  it('deflects the ball to the right on a right ramp', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 }, aims: [{ kind: 'deliver', target: { x: 1, y: 5 } }] };

    const result = simulate(board, [{ kind: 'ramp-right', at: { x: 0, y: 2 } }]);

    expect(result.solved).toBe(true);
  });

  it('carries the ball sideways along a row of conveyors', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 }, aims: [{ kind: 'deliver', target: { x: 2, y: 5 } }] };
    const parts = [
      { kind: 'conveyor-right', at: { x: 0, y: 2 } },
      { kind: 'conveyor-right', at: { x: 1, y: 2 } },
    ];

    expect(simulate(board, parts).solved).toBe(true);
  });

  it('ends the run with a lost ball when conveyors loop it forever', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 } };
    const parts = [
      { kind: 'conveyor-right', at: { x: 0, y: 2 } },
      { kind: 'conveyor-left', at: { x: 1, y: 2 } },
    ];

    const result = simulate(board, parts);

    expect(result.solved).toBe(false);
    expect(result.ticks).toBeLessThanOrEqual(MAX_TICKS);
  });

  it('throws the ball up and across on a trampoline, then it falls', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 }, aims: [{ kind: 'deliver', target: { x: 1, y: 5 } }] };

    expect(simulate(board, [{ kind: 'trampoline-right', at: { x: 0, y: 4 } }]).solved).toBe(true);
  });

  it('launches the ball low and far on a spring', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 0, y: 0 }, aims: [{ kind: 'deliver', target: { x: 3, y: 5 } }] };

    expect(simulate(board, [{ kind: 'spring-right', at: { x: 0, y: 4 } }]).solved).toBe(true);
  });

  it('flips a seesaw after each pass so the second pass goes the other way', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 2, y: 0 }, aims: [{ kind: 'deliver', target: { x: 1, y: 5 } }] };
    const parts = [
      { kind: 'seesaw-right', at: { x: 2, y: 2 } },
      { kind: 'trampoline-left', at: { x: 3, y: 4 } },
    ];

    expect(simulate(board, parts).solved).toBe(true);
  });

  describe('fan', () => {
    const fan = { kind: 'fan-right', at: { x: 0, y: 1 } };
    const into = (x: number, targetX: number): Board => ({ ...emptyBoard, ballStart: { x, y: 0 }, aims: [{ kind: 'deliver', target: { x: targetX, y: 5 } }] });

    it('blows the ball sideways when it crosses the jet, over the fan and the two cells beside it', () => {
      expect(simulate(into(0, 2), [fan]).solved).toBe(true);
      expect(simulate(into(2, 4), [fan]).solved).toBe(true);
    });

    it('leaves the ball alone outside the jet', () => {
      expect(simulate(into(3, 3), [fan]).solved).toBe(true);
    });
  });

  describe('left variants', () => {
    const deliverTo = (x: number, targetX: number): Board => ({ ...emptyBoard, ballStart: { x, y: 0 }, aims: [{ kind: 'deliver', target: { x: targetX, y: 5 } }] });

    it('deflects the ball to the left on a left ramp', () => {
      expect(simulate(deliverTo(4, 3), [{ kind: 'ramp-left', at: { x: 4, y: 2 } }]).solved).toBe(true);
    });

    it('launches the ball to the left on a left spring', () => {
      expect(simulate(deliverTo(4, 1), [{ kind: 'spring-left', at: { x: 4, y: 4 } }]).solved).toBe(true);
    });

    it('blows the ball to the left in the jet of a left fan', () => {
      expect(simulate(deliverTo(4, 2), [{ kind: 'fan-left', at: { x: 4, y: 1 } }]).solved).toBe(true);
    });
  });

  it('ends the run as soon as the ball leaves the board', () => {
    const board: Board = { ...emptyBoard, ballStart: { x: 4, y: 0 } };

    const result = simulate(board, [{ kind: 'conveyor-right', at: { x: 4, y: 2 } }]);

    expect(result).toEqual({ solved: false, ticks: 3 });
  });

  describe('Light aim', () => {
    const lightBoard = (...candles: Cell[]): Board => ({ ...emptyBoard, aims: [{ kind: 'light', candles }] });

    it('is solved when the ball passes through every candle', () => {
      expect(simulate(lightBoard({ x: 2, y: 1 }, { x: 2, y: 3 }), []).solved).toBe(true);
    });

    it('fails while a candle is left unlit', () => {
      expect(simulate(lightBoard({ x: 2, y: 1 }, { x: 3, y: 3 }), []).solved).toBe(false);
    });
  });

  describe('Flip aim', () => {
    const flipBoard = (...switches: Cell[]): Board => ({ ...emptyBoard, aims: [{ kind: 'flip', switches }] });
    const twoPasses = [
      { kind: 'seesaw-right', at: { x: 2, y: 2 } },
      { kind: 'trampoline-left', at: { x: 3, y: 4 } },
    ];

    it('is solved when every switch was crossed an odd number of times', () => {
      expect(simulate(flipBoard({ x: 3, y: 3 }), twoPasses).solved).toBe(true);
    });

    it('fails when a switch was crossed twice and so is back off', () => {
      expect(simulate(flipBoard({ x: 3, y: 3 }, { x: 2, y: 1 }), twoPasses).solved).toBe(false);
    });

    it('fails when a switch was never crossed', () => {
      expect(simulate(flipBoard({ x: 0, y: 3 }), []).solved).toBe(false);
    });
  });
});
