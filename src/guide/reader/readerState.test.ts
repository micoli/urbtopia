import { describe, expect, it } from 'vitest';
import { difficultyOf, isAdapting, totalCitizens } from '../../core';
import { CITIZEN_STEPS, readerSettingsOf, searchOf } from './readerSettings';
import { readerStateOf } from './readerState';

describe('readerStateOf', () => {
  it('builds a city of at least the chosen size, at the chosen Difficulty', () => {
    for (const citizens of CITIZEN_STEPS) {
      const state = readerStateOf({ difficulty: 'hard', citizens });
      expect(totalCitizens(state)).toBeGreaterThanOrEqual(citizens);
      expect(totalCitizens(state)).toBeLessThan(citizens + 6);
      expect(difficultyOf(state)).toBe('hard');
    }
  });

  it('is neither adapting nor dependent on the moment it is built', () => {
    const state = readerStateOf({ difficulty: 'medium', citizens: 300 });
    expect(isAdapting(state)).toBe(false);
    expect(readerStateOf({ difficulty: 'medium', citizens: 300 })).toEqual(state);
  });
});

describe('reader settings in the URL', () => {
  it('round-trips through the query string', () => {
    expect(readerSettingsOf(searchOf({ difficulty: 'easy', citizens: 250 }))).toEqual({ difficulty: 'easy', citizens: 250 });
  });

  it('ignores a query without settings and repairs invalid values', () => {
    expect(readerSettingsOf('')).toBeNull();
    expect(readerSettingsOf('?difficulty=extreme&citizens=-3')).toEqual({ difficulty: 'medium', citizens: 0 });
  });
});
