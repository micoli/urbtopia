import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, greenProfileOf, maxTierOf, newGame, upgradeCostOf } from '../index';

const T0 = 1_700_000_000_000;

describe('Tree and Park Tiers', () => {
  it.each(['tree', 'park', 'nature-tree-tall', 'nature-tree-tall-dark', 'nature-tree-tall-fall'] as const)('%s has 5 Tiers whose benefits never decrease', (type) => {
    expect(maxTierOf(type)).toBe(5);
    for (let tier = 2; tier <= 5; tier++) {
      const before = greenProfileOf(type, tier - 1)!;
      const after = greenProfileOf(type, tier)!;
      expect(after.radius).toBeGreaterThanOrEqual(before.radius);
      expect(after.cooling).toBeGreaterThan(before.cooling);
      expect(after.wellbeing).toBeGreaterThan(before.wellbeing);
      expect(upgradeCostOf(type, tier)?.urbs).toBeGreaterThan(0);
    }
  });

  it('keeps the benefits of Tier 1 as before', () => {
    expect(greenProfileOf('tree')).toEqual({ radius: 4, cooling: 1, biodiversity: 1, wellbeing: 1 });
    expect(greenProfileOf('park')).toEqual({ radius: 6, cooling: 3, biodiversity: 3, wellbeing: 3 });
  });

  it('upgrades a Tree for Urbs only', () => {
    const state = { ...newGame({ seed: 'green', now: T0 }), urbs: 1000, buildings: [createBuilding(1, 'tree', 3, 3, 0)] };
    const result = dispatch(state, { type: 'UpgradeBuilding', buildingId: 1 }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.buildings[0]!.tier).toBe(2);
    expect(result.state.urbs).toBe(1000 - upgradeCostOf('tree', 2)!.urbs);
  });
});
