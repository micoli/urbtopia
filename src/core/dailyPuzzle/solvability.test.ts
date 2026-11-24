import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generate';
import { simulate } from './simulate';
import type { Difficulty } from './types';

const SEEDS_PER_DIFFICULTY = 1000;

describe.each(['easy', 'medium', 'hard'] as Difficulty[])('the %s puzzles of a fixed batch of seeds', (difficulty) => {
  it('are all generated, solved by their witness, unsolved when empty and need every Part of it', () => {
    const failures: string[] = [];
    for (let index = 0; index < SEEDS_PER_DIFFICULTY; index += 1) {
      const seed = `batch-${index}`;
      try {
        const { board, witness } = generatePuzzle(seed, difficulty);
        if (!simulate(board, witness).solved) failures.push(`${seed}: witness does not solve`);
        if (simulate(board, []).solved) failures.push(`${seed}: solved with no Part`);
        const dispensable = witness.filter((_, skipped) => simulate(board, witness.filter((__, kept) => kept !== skipped)).solved);
        if (dispensable.length > 0) failures.push(`${seed}: still solved without ${dispensable.map((part) => part.kind).join(', ')}`);
      } catch (error) {
        failures.push(`${seed}: ${(error as Error).message}`);
      }
    }

    expect(failures).toEqual([]);
  }, 60_000);
});
