import { describe, expect, it } from 'vitest';
import { newGame } from '../../core';
import { startRefusal } from './startRefusal';

const city = { ...newGame({ seed: 'refusal', now: 1_700_000_000_000 }), tutorial: null };

describe('why a Replan cannot start', () => {
  it('is free to start in a quiet City', () => {
    expect(startRefusal(city, false)).toBeNull();
  });

  it('says why during a Challenge, the Tutorial and a Save conflict', () => {
    expect(startRefusal({ ...city, challenge: {} as never }, false)).toBe('replan.blocked.challenge');
    expect(startRefusal({ ...city, tutorial: 'wood' as never }, false)).toBe('replan.blocked.tutorial');
    expect(startRefusal(city, true)).toBe('replan.blocked.conflict');
  });
});
