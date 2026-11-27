import { describe, expect, it } from 'vitest';
import { newEditor, placePart } from './contraption';
import { generatePuzzle } from './generate';
import { simulate } from './simulate';
import type { Difficulty } from './types';

// A hard puzzle takes about 170 ms to build, so its batch is smaller.
const SEEDS: Record<Difficulty, number> = { easy: 300, medium: 300, hard: 100 };

describe.each(['easy', 'medium', 'hard'] as Difficulty[])('the %s puzzles of a fixed batch of seeds', (difficulty) => {
  it('are all generated, solved by their witness, unsolved when empty, need every Part of it, and can have that witness placed by the rules of the editor', () => {
    const failures: string[] = [];
    for (let index = 0; index < SEEDS[difficulty]; index += 1) {
      const seed = `batch-${index}`;
      try {
        const puzzle = generatePuzzle(seed, difficulty);
        const { board, witness } = puzzle;
        let editor = newEditor();
        for (const part of witness) {
          const next = placePart(puzzle, editor, part.kind, part.at);
          if (next) editor = next;
          else failures.push(`${seed}: the witness cannot place ${part.kind} at ${part.at.x},${part.at.y}`);
        }
        if (!simulate(board, witness).solved) failures.push(`${seed}: witness does not solve`);
        if (simulate(board, []).solved) failures.push(`${seed}: solved with no Part`);
        const dispensable = witness.filter((_, skipped) => simulate(board, witness.filter((__, kept) => kept !== skipped)).solved);
        if (dispensable.length > 0) failures.push(`${seed}: still solved without ${dispensable.map((part) => part.kind).join(', ')}`);
      } catch (error) {
        failures.push(`${seed}: ${(error as Error).message}`);
      }
    }

    expect(failures).toEqual([]);
  }, 180_000);
});
