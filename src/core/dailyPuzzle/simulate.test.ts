import { describe, expect, it } from 'vitest';
import { MAX_TICKS, simulate } from './simulate';
import type { Board } from './types';

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
});
