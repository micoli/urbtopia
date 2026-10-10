import { describe, expect, it } from 'vitest';
import { resolveTiers, resolveVariant } from './tiers';

describe('Tiers', () => {
  it('inherit what they leave out, except the upgrade cost', () => {
    const tiers = resolveTiers<{ model: string; citizens: number; upgradeCost?: { urbs: number } }>([{ model: 'a', citizens: 6 }, { citizens: 15, upgradeCost: { urbs: 150 } }, { model: 'b' }]);
    expect(tiers).toEqual([{ model: 'a', citizens: 6 }, { model: 'a', citizens: 15, upgradeCost: { urbs: 150 } }, { model: 'b', citizens: 15 }]);
  });

  it('take a variant over their first Tiers only', () => {
    const base = resolveTiers<{ model: string }>([{ model: 'k' }, { model: 'h' }, { model: 'a' }, { model: 'h' }, { model: 'f' }]);
    expect(resolveVariant(base, [{ model: 'j' }, { model: 'u' }, {}, { model: 'b' }]).map(({ model }) => model)).toEqual(['j', 'u', 'u', 'b', 'f']);
  });
});
