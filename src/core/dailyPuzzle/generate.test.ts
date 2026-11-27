import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generate';
import { simulate } from './simulate';

describe('generatePuzzle', () => {
  it('gives the same puzzle for the same seed and difficulty', () => {
    expect(generatePuzzle('amber-fox-4821', 'medium')).toEqual(generatePuzzle('amber-fox-4821', 'medium'));
  });

  it('gives different puzzles for different seeds and for different difficulties', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e'];

    expect(new Set(seeds.map((seed) => JSON.stringify(generatePuzzle(seed, 'easy')))).size).toBeGreaterThan(1);
    expect(generatePuzzle('a', 'easy')).not.toEqual(generatePuzzle('a', 'hard'));
  });

  it.each([
    ['easy', 10, 8, 1],
    ['medium', 14, 10, 2],
    ['hard', 18, 12, 3],
  ] as const)('sizes the %s board to %i x %i with %i distinct aims', (difficulty, width, height, aimCount) => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const { board } = generatePuzzle(seed, difficulty);

      expect(board.width).toBe(width);
      expect(board.height).toBe(height);
      expect(new Set(board.aims.map((aim) => aim.kind)).size).toBe(aimCount);
    }
  });

  describe.each([
    ['easy', 4, 3],
    ['medium', 7, 5],
    ['hard', 11, 8],
  ] as const)('a %s puzzle', (difficulty, useful, decoys) => {
    const puzzles = ['a', 'b', 'c', 'd', 'e', 'f'].map((seed) => generatePuzzle(seed, difficulty));

    it('is solved by its witness', () => {
      for (const { board, witness } of puzzles) expect(simulate(board, witness).solved).toBe(true);
    });

    it('is not solved with no Part placed', () => {
      for (const { board } of puzzles) expect(simulate(board, []).solved).toBe(false);
    });

    it('hands out the witness Parts plus the decoys', () => {
      for (const { inventory, witness } of puzzles) {
        expect(witness).toHaveLength(useful);
        expect(inventory).toHaveLength(useful + decoys);
        const remaining = [...inventory];
        for (const part of witness) remaining.splice(remaining.indexOf(part.kind), 1);
        expect(remaining).toHaveLength(decoys);
      }
    });
  });
});
