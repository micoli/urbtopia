import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, newGame } from './index';

const START = 1_700_000_000_000;
const HOUR = 3_600_000;

const seedArb = fc.stringMatching(/^[a-z]{3,8}-[a-z]{3,8}-[0-9]{4}$/);
const offsetArb = fc.integer({ min: -48 * HOUR, max: 200 * HOUR });

describe('core properties', () => {
  it('survives a JSON round trip after any sequence of advances', () => {
    fc.assert(
      fc.property(seedArb, fc.array(offsetArb, { maxLength: 8 }), (seed, offsets) => {
        let state = newGame({ seed, now: START });
        for (const offset of offsets) state = advance(state, START + offset).state;
        expect(JSON.parse(JSON.stringify(state))).toEqual(state);
      }),
    );
  });

  it('advance(t1) then advance(t2) equals advance(t2)', () => {
    fc.assert(
      fc.property(seedArb, offsetArb, offsetArb, (seed, a, b) => {
        const [t1, t2] = [START + Math.min(a, b), START + Math.max(a, b)];
        const initial = newGame({ seed, now: START });
        expect(advance(advance(initial, t1).state, t2).state).toEqual(advance(initial, t2).state);
      }),
    );
  });

  it('never moves lastSeen backward', () => {
    fc.assert(
      fc.property(seedArb, fc.array(offsetArb, { minLength: 1, maxLength: 8 }), (seed, offsets) => {
        let state = newGame({ seed, now: START });
        for (const offset of offsets) {
          const next = advance(state, START + offset).state;
          expect(next.lastSeen).toBeGreaterThanOrEqual(state.lastSeen);
          state = next;
        }
      }),
    );
  });

  it('is deterministic for a given Seed', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        expect(newGame({ seed, now: START })).toEqual(newGame({ seed, now: START }));
      }),
    );
  });
});
