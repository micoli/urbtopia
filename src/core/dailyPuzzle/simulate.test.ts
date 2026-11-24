import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';
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
});
