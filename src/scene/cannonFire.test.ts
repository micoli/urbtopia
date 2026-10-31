import { describe, expect, it } from 'vitest';
import { GUNS_PER_SIDE, cannonPuff } from './cannonFire';

const samples = Array.from({ length: 260 }, (_, index) => index / 100);

describe('cannonPuff', () => {
  it('fires part of the time, on a repeating beat', () => {
    const firing = samples.filter(clock => cannonPuff(3, 1, 0, clock)).length;
    expect(firing).toBeGreaterThan(0);
    expect(firing).toBeLessThan(samples.length);
    expect(cannonPuff(3, 1, 0, 0.4)).toEqual(cannonPuff(3, 1, 0, 0.4 + 2.6));
  });

  it('does not fire all the guns of a ship at once', () => {
    const guns = [1, -1].flatMap(side => Array.from({ length: GUNS_PER_SIDE }, (_, gun) => samples.findIndex(clock => cannonPuff(5, side as 1 | -1, gun, clock)?.flash)));
    expect(new Set(guns).size).toBeGreaterThan(1);
  });

  it('flashes first, then drifts away from the hull as it rises', () => {
    const puffs = samples.map(clock => cannonPuff(7, -1, 1, clock)).filter(puff => puff !== null);
    expect(puffs.some(puff => puff.flash)).toBe(true);
    expect(puffs.some(puff => !puff.flash)).toBe(true);
    for (const puff of puffs) {
      expect(puff.size).toBeGreaterThan(0);
      expect(puff.size).toBeLessThan(0.2);
      expect(puff.travel).toBeLessThan(0.4);
    }
  });
});
