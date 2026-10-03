import { describe, expect, it } from 'vitest';
import { generateSeed, hashSeed, nextRandom } from '../index';

describe('nextRandom', () => {
  it('returns values in [0, 1)', () => {
    let rngState = hashSeed('amber-fox-4821');
    for (let i = 0; i < 1000; i++) {
      const step = nextRandom(rngState);
      expect(step.value).toBeGreaterThanOrEqual(0);
      expect(step.value).toBeLessThan(1);
      rngState = step.rngState;
    }
  });

  it('is a pure function of the state', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
  });

  it('produces the reference mulberry32 sequence for state 0', () => {
    const first = nextRandom(0);
    const second = nextRandom(first.rngState);
    expect(first.value).toBeCloseTo(0.26642920868471265, 12);
    expect(second.value).toBeCloseTo(0.0003297457005828619, 12);
  });

  it('resumes identically from a stored state', () => {
    const a1 = nextRandom(hashSeed('s'));
    const a2 = nextRandom(a1.rngState);
    const resumed = nextRandom(JSON.parse(JSON.stringify(a1.rngState)));
    expect(resumed).toEqual(a2);
  });
});

describe('generateSeed', () => {
  it('builds a readable text Seed from entropy', () => {
    expect(generateSeed(123456)).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
  });

  it('is deterministic for a given entropy and varies with it', () => {
    expect(generateSeed(1)).toBe(generateSeed(1));
    const seeds = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(generateSeed));
    expect(seeds.size).toBeGreaterThan(4);
  });
});
