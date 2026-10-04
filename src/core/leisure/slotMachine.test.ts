import { describe, expect, it } from 'vitest';
import { SLOT_PAYOUTS, SLOT_SYMBOLS, slotOutcome, slotPayout, spinSlotMachine } from './slotMachine';

describe('slot machine', () => {
  it('classifies the reels', () => {
    expect(slotOutcome(['cherry', 'lemon', 'bell'])).toBe('none');
    expect(slotOutcome(['cherry', 'lemon', 'cherry'])).toBe('pair');
    expect(slotOutcome(['bell', 'bell', 'bell'])).toBe('threeAlike');
    expect(slotOutcome(['seven', 'seven', 'seven'])).toBe('threeSevens');
  });

  it('pays a multiple of the stake, rounded down', () => {
    expect(slotPayout('none', 100)).toBe(0);
    expect(slotPayout('pair', 10)).toBe(15);
    expect(slotPayout('threeAlike', 50)).toBe(500);
    expect(slotPayout('threeSevens', 100)).toBe(2000);
  });

  it('is deterministic for a given generator state and advances it', () => {
    const first = spinSlotMachine(12345, 10);
    expect(spinSlotMachine(12345, 10)).toEqual(first);
    expect(first.rngState).not.toBe(12345);
  });

  it('returns about 95% of the stake over many spins', () => {
    const exact = (90 * SLOT_PAYOUTS.pair + 5 * SLOT_PAYOUTS.threeAlike + SLOT_PAYOUTS.threeSevens) / SLOT_SYMBOLS.length ** 3;
    expect(exact).toBeGreaterThan(0.94);
    expect(exact).toBeLessThan(0.96);
    let rngState = 987654321;
    let paid = 0;
    const spins = 200_000;
    for (let spin = 0; spin < spins; spin++) {
      const result = spinSlotMachine(rngState, 100);
      rngState = result.rngState;
      paid += result.payout;
    }
    expect(paid / (spins * 100)).toBeGreaterThan(0.9);
    expect(paid / (spins * 100)).toBeLessThan(1);
  });
});
