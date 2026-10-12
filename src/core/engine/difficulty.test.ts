import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, advance, difficultyOf, dispatch, newGame } from '../index';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

describe('Difficulty', () => {
  const fresh = newGame({ seed: 'amber-fox-4821', now: T0 });

  it('is Cozy for a new game and for a city that has no Difficulty', () => {
    expect(difficultyOf(fresh)).toBe('cozy');
    expect(fresh.difficulty).toBeUndefined();
  });

  it.each(DIFFICULTIES)('can be set to %s', (difficulty) => {
    const result = dispatch(fresh, { type: 'SetDifficulty', difficulty }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(difficultyOf(result.state)).toBe(difficulty);
  });

  it('can be changed back and forth at any time', () => {
    const hard = dispatch(fresh, { type: 'SetDifficulty', difficulty: 'hard' }, T0);
    if (!hard.ok) throw new Error(hard.error.key);
    const easy = dispatch(hard.state, { type: 'SetDifficulty', difficulty: 'easy' }, T0 + HOUR);
    if (!easy.ok) throw new Error(easy.error.key);
    expect(difficultyOf(easy.state)).toBe('easy');
  });

  it('survives the offline replay, whatever the gap', () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 100 * HOUR }), (difficulty, gap) => {
        const city = { ...fresh, difficulty };
        expect(difficultyOf(advance(city, T0 + gap).state)).toBe(difficulty);
      }),
      { numRuns: 50 },
    );
  });
});
