import { describe, expect, it } from 'vitest';
import { generateLevel } from './levelGenerator';
import { THREE_STARS_MIN_MOVES_LEFT_RATIO } from './scoring';
import { solve } from './solver';

const SLOW_TEST_MS = 60_000;

describe('level winnability', () => {
  it('has a known winning sequence within the move budget', () => {
    for (let number = 1; number <= 60; number++) {
      const level = generateLevel('winnable', number);
      expect(solve(level, level.moves), `level ${number}`).not.toBeNull();
    }
  }, SLOW_TEST_MS);

  it('leaves enough spare moves for three stars in try hard mode', () => {
    for (let number = 1; number <= 60; number++) {
      const level = generateLevel('winnable', number, true);
      const winningMoves = solve(level, level.moves);
      expect(winningMoves, `level ${number}`).not.toBeNull();
      expect((level.moves - winningMoves!) / level.moves, `level ${number}`).toBeGreaterThanOrEqual(
        THREE_STARS_MIN_MOVES_LEFT_RATIO,
      );
    }
  }, SLOW_TEST_MS);
});
