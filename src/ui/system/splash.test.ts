import { describe, expect, it } from 'vitest';
import { nextProgress } from './splash';

describe('nextProgress', () => {
  it('follows the share of files that have arrived', () => {
    expect(nextProgress(0, 3, 12)).toBeCloseTo(0.25);
    expect(nextProgress(0.25, 6, 12)).toBeCloseTo(0.5);
  });

  it('never moves back when more files are asked for later', () => {
    expect(nextProgress(0.8, 8, 20)).toBe(0.8);
  });

  it('stays put while nothing has been asked for, and stops at the end', () => {
    expect(nextProgress(0, 0, 0)).toBe(0);
    expect(nextProgress(0.4, 0, 0)).toBe(0.4);
    expect(nextProgress(0.9, 12, 10)).toBe(1);
  });
});
