import { describe, expect, it } from 'vitest';
import { parseSeenHints } from './hintsStore';

describe('parseSeenHints', () => {
  it('starts empty without a stored value', () => {
    expect(parseSeenHints(null)).toEqual([]);
  });

  it('keeps only known hints', () => {
    expect(parseSeenHints('["build","nope","repaint"]')).toEqual(['build', 'repaint']);
  });

  it('survives corrupted storage', () => {
    expect(parseSeenHints('{oops')).toEqual([]);
    expect(parseSeenHints('42')).toEqual([]);
  });
});
