import { describe, expect, it } from 'vitest';
import { STORAGE_TYPES, storageTierOf } from './economy';
import { maxTierOf } from './tiers';

// The unfolded Tiers keep the former rule: a base capacity plus a fixed step per Tier.
const FORMER = {
  storehouse: { materials: [20, 10], goods: [40, 20], crops: [0, 0] },
  silo: { materials: [40, 20], goods: [0, 0], crops: [0, 0] },
  vault: { materials: [0, 0], goods: [80, 40], crops: [0, 0] },
  grainSilo: { materials: [0, 0], goods: [0, 0], crops: [40, 20] },
} as const;

describe('storage Tiers', () => {
  it.each(STORAGE_TYPES)('give %s the capacities of the former base plus step rule', type => {
    expect(maxTierOf(type)).toBe(6);
    for (let tier = 1; tier <= 6; tier++) {
      const expected = Object.fromEntries(Object.entries(FORMER[type]).map(([compartment, [base, step]]) => [compartment, base + step * (tier - 1)]));
      expect(storageTierOf(type, tier)).toEqual(expected);
    }
  });
});
