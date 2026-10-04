import { describe, expect, it } from 'vitest';
import { clearPoints, remainingMovePoints } from './scoring';

describe('scoring', () => {
  it('multiplies tile points by the cascade chain', () => {
    const stats = { boxes: 0, ice: 0 };
    expect(clearPoints(3, 1, stats)).toBe(30);
    expect(clearPoints(3, 3, stats)).toBe(90);
  });

  it('rewards broken boxes and ice', () => {
    expect(clearPoints(0, 1, { boxes: 2, ice: 1 })).toBe(90);
  });

  it('gives a bonus per remaining move', () => {
    expect(remainingMovePoints()).toBeGreaterThan(0);
  });
});
