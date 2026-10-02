import { describe, expect, it } from 'vitest';
import { advance, newGame } from './index';

const START = 1_700_000_000_000;
const HOUR = 3_600_000;

describe('advance', () => {
  const initial = newGame({ seed: 'amber-fox-4821', now: START });

  it('moves lastSeen forward to now', () => {
    expect(advance(initial, START + HOUR).state.lastSeen).toBe(START + HOUR);
  });

  it('clamps a backward clock to lastSeen', () => {
    const { state } = advance(initial, START - 5 * HOUR);
    expect(state.lastSeen).toBe(START);
  });

  it('gives the same result whether time is advanced in steps or in one call', () => {
    const times = [1, 7, 60, 61, 3600, 7200].map((s) => START + s * 1000);
    for (const t1 of times) {
      for (const t2 of times.filter((t) => t >= t1)) {
        const stepped = advance(advance(initial, t1).state, t2).state;
        const direct = advance(initial, t2).state;
        expect(stepped).toEqual(direct);
      }
    }
  });

  it('does not mutate the input state', () => {
    const snapshot = structuredClone(initial);
    advance(initial, START + HOUR);
    expect(initial).toEqual(snapshot);
  });
});
