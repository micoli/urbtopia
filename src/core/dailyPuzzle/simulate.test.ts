import { describe, expect, it } from 'vitest';
import { PHYSICS, runBall, simulate } from './simulate';
import type { Aim, Board, Cell, PlacedPart } from './types';

const R = PHYSICS.ballRadius;

function boardOf(aims: Aim[], overrides: Partial<Board> = {}): Board {
  return { width: 8, height: 8, ballStart: { x: 3, y: 0 }, aims, ...overrides };
}

const deliverTo = (x: number): Aim => ({ kind: 'deliver', target: { x, y: 7 } });
const at = (kind: string, x: number, y: number): PlacedPart => ({ kind, at: { x, y } });

// Where the ball reaches the bottom of the board, across the cell it would drop into: the board has no floor, a ball that is not caught by the target falls out.
function landing(board: Board, parts: PlacedPart[]): Cell {
  const { crossing } = runBall(board, parts);
  expect(crossing).toBeDefined();
  return { x: Math.floor((crossing as { x: number }).x), y: board.height - 1 };
}

// The biggest jump of the ball between two samples: a trajectory with no sudden stop or turn keeps it small.
function biggestStep(board: Board, parts: PlacedPart[]): number {
  const { xs, ys } = runBall(board, parts);
  return Math.max(...xs.slice(1).map((x, index) => Math.hypot(x - (xs[index] as number), (ys[index + 1] as number) - (ys[index] as number))));
}

describe('the ball falls', () => {
  it('drops straight under gravity into the target under its start and comes to rest in it', () => {
    const board = boardOf([deliverTo(3)]);
    const run = runBall(board, []);

    expect(run.landed).toBe(true);
    expect(run.landing).toEqual({ x: 3, y: 7 });
    expect(simulate(board, []).solved).toBe(true);
  });

  it('takes the time that gravity asks to fall to the target', () => {
    const { seconds } = simulate(boardOf([deliverTo(3)]), []);

    expect(seconds).toBeGreaterThan(1);
    expect(seconds).toBeLessThan(2.5);
  });

  it('has no floor: a ball that misses the target falls out of the bottom of the board and is lost', () => {
    const run = runBall(boardOf([deliverTo(5)]), []);

    expect(run.landed).toBe(false);
    expect(simulate(boardOf([deliverTo(5)]), []).solved).toBe(false);
    expect(Math.max(...run.ys)).toBeGreaterThan(8);
    expect(simulate(boardOf([deliverTo(5)]), []).seconds).toBeLessThan(3);
  });

  it('is caught by the target when it falls anywhere over the cup, and not when it falls beside it', () => {
    const over = (x: number) => simulate(boardOf([deliverTo(3)], { ballStart: { x, y: 0 } }), []);

    expect(over(3).solved).toBe(true);
    expect(over(2).solved).toBe(false);
    expect(over(4).solved).toBe(false);
  });

  it('gives the same trajectory every time', () => {
    const parts = [at('ramp-right', 3, 2), at('trampoline-right', 4, 5)];
    const board = boardOf([deliverTo(5)]);

    expect(runBall(board, parts)).toEqual(runBall(board, parts));
  });
});

describe('a ramp', () => {
  it('sends the ball down its slope, and it leaves with the speed it picked up and drifts on while it falls', () => {
    const board = boardOf([deliverTo(5)]);

    expect(landing(board, [at('ramp-right', 3, 2)]).x).toBeGreaterThanOrEqual(5);
    expect(landing(board, [at('ramp-left', 3, 2)]).x).toBeLessThanOrEqual(1);
  });

  it('follows a smooth path, with no sudden stop or turn', () => {
    expect(biggestStep(boardOf([deliverTo(5)]), [at('ramp-right', 3, 2)])).toBeLessThan(0.3);
  });
});

describe('a conveyor', () => {
  it('carries the ball along its belt and drops it off the end', () => {
    const board = boardOf([deliverTo(5)]);

    expect(landing(board, [at('conveyor-right', 3, 3)]).x).toBeGreaterThanOrEqual(4);
    expect(landing(board, [at('conveyor-right', 3, 3), at('conveyor-right', 4, 3)]).x).toBeGreaterThanOrEqual(5);
    expect(landing(board, [at('conveyor-left', 3, 3)]).x).toBeLessThanOrEqual(2);
  });
});

describe('a trampoline', () => {
  const board = boardOf([deliverTo(5)]);
  const parts = [at('trampoline-right', 3, 5)];

  it('throws the ball back nearly as high as it fell, in an arc, with no sudden stop at the top', () => {
    const { xs, ys, events } = runBall(board, parts);
    const hit = events.find((event) => event.kind === 'hit') as { t: number };
    const contact = Math.round(hit.t / PHYSICS.step);
    const apex = Math.min(...ys.slice(contact + 3, contact + 200));
    const lowest = Math.max(...ys.slice(0, contact + 3));

    expect(lowest - apex).toBeGreaterThan(2.5);
    expect(xs[contact + 60]).toBeGreaterThan(xs[contact] as number);
    expect(biggestStep(board, parts)).toBeLessThan(0.3);
  });

  it('keeps the horizontal speed of the bounce, so the ball does not come back down at a peak', () => {
    const { xs, ys, events } = runBall(board, parts);
    const hit = events.find((event) => event.kind === 'hit') as { t: number };
    const contact = Math.round(hit.t / PHYSICS.step);
    const apexIndex = ys.slice(contact + 3, contact + 200).reduce((best, y, index, all) => (y < (all[best] as number) ? index : best), 0) + contact + 3;

    expect((xs[apexIndex + 20] as number) - (xs[apexIndex] as number)).toBeGreaterThan(0.2);
    expect(landing(board, parts).x).toBeGreaterThan(3);
  });
});

describe('a spring', () => {
  it('launches the ball up and far to its side, much farther than a ramp does', () => {
    const board = boardOf([deliverTo(6)]);

    expect(landing(board, [at('spring-right', 3, 5)]).x).toBeGreaterThanOrEqual(5);
    expect(Math.min(...runBall(board, [at('spring-left', 3, 5)]).xs)).toBeLessThan(1.5);
    expect(biggestStep(board, [at('spring-right', 3, 5)])).toBeLessThan(0.3);
  });
});

describe('a seesaw', () => {
  it('slides the ball down the side it leans to, and turns over once the ball has left it', () => {
    const board = boardOf([deliverTo(5)]);
    const run = runBall(board, [at('seesaw-right', 3, 3)]);

    expect(landing(board, [at('seesaw-right', 3, 3)]).x).toBeGreaterThanOrEqual(4);
    expect(landing(board, [at('seesaw-left', 3, 3)]).x).toBeLessThanOrEqual(3);
    expect(run.events.filter((event) => event.kind === 'flip' && event.cell.x === 3 && event.cell.y === 3)).toHaveLength(1);
  });
});

describe('a fan', () => {
  it('blows the ball sideways over its whole jet, not only over its own cell, and the ball keeps drifting after it', () => {
    const board = boardOf([deliverTo(6)]);

    expect(landing(board, [at('fan-right', 3, 2)]).x).toBeGreaterThanOrEqual(5);
    expect(landing(board, [at('fan-left', 3, 2)]).x).toBeLessThanOrEqual(1);
    expect(biggestStep(board, [at('fan-right', 3, 2)])).toBeLessThan(0.3);
  });

  it('leaves the ball alone outside its jet', () => {
    expect(landing(boardOf([deliverTo(3)]), [at('fan-right', 5, 2)]).x).toBe(3);
  });

  it('marks when the ball enters and leaves its jet', () => {
    const { events } = runBall(boardOf([deliverTo(6)]), [at('fan-right', 3, 2)]);

    expect(events.filter((event) => event.kind === 'jet')).toHaveLength(1);
    expect(events.filter((event) => event.kind === 'jet-end')).toHaveLength(1);
  });
});

describe('the edges of the board', () => {
  it('keeps the ball in: the side walls send it back', () => {
    const board = boardOf([deliverTo(4)], { width: 5, ballStart: { x: 3, y: 0 } });
    const { xs } = runBall(board, [at('fan-right', 3, 2), at('conveyor-right', 4, 4)]);

    expect(Math.max(...xs)).toBeLessThanOrEqual(5 - R + 1e-9);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(R - 1e-9);
  });

  it('tells when the ball hits a side wall, and which one', () => {
    const board = boardOf([deliverTo(4)], { width: 5, ballStart: { x: 3, y: 0 } });
    const { events } = runBall(board, [at('fan-right', 3, 2), at('conveyor-right', 4, 4)]);
    const wall = events.find((event) => event.kind === 'wall');

    expect(wall?.cell.x).toBe(5);
  });
});

describe('the Aims', () => {
  it('Light: a candle is lit when the ball goes through it', () => {
    expect(simulate(boardOf([deliverTo(3), { kind: 'light', candles: [{ x: 3, y: 4 }] }]), []).solved).toBe(true);
    expect(simulate(boardOf([deliverTo(3), { kind: 'light', candles: [{ x: 3, y: 4 }, { x: 6, y: 4 }] }]), []).solved).toBe(false);
  });

  it('Flip: a switch is on once the ball has crossed it an odd number of times', () => {
    expect(simulate(boardOf([deliverTo(3), { kind: 'flip', switches: [{ x: 3, y: 4 }] }]), []).solved).toBe(true);
    expect(simulate(boardOf([deliverTo(3), { kind: 'flip', switches: [{ x: 6, y: 4 }] }]), []).solved).toBe(false);
  });

  it('Collect: every star must be taken, then the ball must be caught at the exit', () => {
    const stars = [{ x: 3, y: 3 }];

    expect(simulate(boardOf([{ kind: 'collect', stars, exit: { x: 3, y: 7 } }]), []).solved).toBe(true);
    expect(simulate(boardOf([{ kind: 'collect', stars, exit: { x: 5, y: 7 } }]), []).solved).toBe(false);
    expect(simulate(boardOf([{ kind: 'collect', stars: [{ x: 6, y: 3 }], exit: { x: 3, y: 7 } }]), []).solved).toBe(false);
  });

  it('needs every Aim of a puzzle', () => {
    const aims: Aim[] = [deliverTo(3), { kind: 'light', candles: [{ x: 6, y: 4 }] }];

    expect(simulate(boardOf(aims), []).solved).toBe(false);
  });
});

describe('a run that does not end by itself', () => {
  it('stops at the limit of time, not solved', () => {
    const board = boardOf([deliverTo(3)]);
    const result = simulate(board, [at('conveyor-right', 3, 3), at('conveyor-left', 4, 3), at('conveyor-left', 2, 3)]);

    expect(result.seconds).toBeLessThanOrEqual(PHYSICS.maxTime + 1e-9);
  });

  it('stops when the ball has stopped moving anywhere but in the target', () => {
    const board = boardOf([deliverTo(1)], { width: 3, ballStart: { x: 1, y: 0 } });
    const result = simulate(board, [at('ramp-left', 1, 3), at('ramp-right', 0, 3)]);

    expect(result.solved).toBe(false);
    expect(result.seconds).toBeLessThan(PHYSICS.maxTime);
  });
});
