import { describe, expect, it } from 'vitest';
import { applyClear, applyGravity, createBoard, findMatches, hasPossibleMove, isFillable, planClear } from './engine';
import type { Board } from './types';
import { generateLevel } from './levelGenerator';

const colorsOf = (board: Board) => board.tiles.map((row) => row.map((tile) => tile?.color ?? null));

describe('generateLevel', () => {
  it('generates identical levels for the same seed and number', () => {
    expect(generateLevel('royal', 12)).toEqual(generateLevel('royal', 12));
  });

  it('generates different levels for different seeds', () => {
    expect(generateLevel('royal', 12)).not.toEqual(generateLevel('crown', 12));
  });

  it('always has at least one goal and a move budget', () => {
    for (let number = 1; number <= 30; number++) {
      const level = generateLevel('check', number);
      expect(level.goals.length).toBeGreaterThan(0);
      expect(level.moves).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('createBoard', () => {
  it('produces the same starting board for the same level', () => {
    const level = generateLevel('royal', 7);
    expect(colorsOf(createBoard(level).board)).toEqual(colorsOf(createBoard(level).board));
  });

  it('starts without matches and with a playable move', () => {
    for (let number = 1; number <= 50; number++) {
      const { board } = createBoard(generateLevel('check', number));
      expect(findMatches(board)).toHaveLength(0);
      expect(hasPossibleMove(board)).toBe(true);
    }
  });
});

describe('cascade', () => {
  it('refills every reachable cell deterministically', () => {
    const run = () => {
      const { board, rng } = createBoard(generateLevel('royal', 20));
      const plan = planClear(board, { activations: [{ r: 3, c: 3, type: 'bomb' }] });
      applyClear(board, plan);
      applyGravity(board, rng);
      return board;
    };
    const board = run();
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (isFillable(board, r, c)) expect(board.tiles[r]![c]).not.toBeNull();
      }
    }
    expect(colorsOf(board)).toEqual(colorsOf(run()));
  });
});

describe('finale explosion', () => {
  it('clears every remaining tile with an all-board activation', () => {
    const { board } = createBoard(generateLevel('royal', 9));
    const plan = planClear(board, { activations: [{ r: 4, c: 3, type: 'all' }] });
    applyClear(board, plan);
    expect(board.tiles.flat().every((tile) => tile === null)).toBe(true);
  });
});

describe('lightning', () => {
  const boardWithBoxNextToColor = () => {
    const { board } = createBoard(generateLevel('royal', 9));
    board.boxes.forEach((row) => row.fill(0));
    const target = { r: 4, c: 3 };
    const color = board.tiles[target.r]![target.c]!.color!;
    board.boxes[target.r]![target.c + 1] = 1;
    board.tiles[target.r]![target.c + 1] = null;
    return { board, color };
  };

  it('hits boxes adjacent to the tiles it clears', () => {
    const { board, color } = boardWithBoxNextToColor();
    const plan = planClear(board, { activations: [{ r: 0, c: 0, type: 'color', color }] });
    expect(plan.boxHits).toContainEqual({ r: 4, c: 4 });
  });

  it('does not extend to boxes next to other bonus blasts', () => {
    const { board } = boardWithBoxNextToColor();
    const plan = planClear(board, { activations: [{ r: 4, c: 3, type: 'rocketV' }] });
    expect(plan.boxHits).toEqual([]);
  });
});
