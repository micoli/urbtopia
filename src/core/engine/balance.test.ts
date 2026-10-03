import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, GOODS, HOME_TIERS, MATERIALS, STORAGE_TIERS, citizensOf, maxTierOf, placementCost, upgradeCostOf, type BuildingType, type GoodId } from '../index';

const MINUTE = 60_000;

function chainMinutes(good: GoodId): number {
  const { recipe, durationMs } = GOODS[good];
  const materials = Object.entries(recipe).reduce((total, [material, amount]) => total + MATERIALS[material as keyof typeof MATERIALS].durationMs * amount, 0);
  return (materials + durationMs) / MINUTE;
}

const valuePerChainMinute = (good: GoodId) => GOODS[good].value / chainMinutes(good);

describe('Good values follow the unlock order', () => {
  const goods = Object.keys(GOODS) as GoodId[];

  it.each(goods)('%s pays at least as much per chain minute as every Good unlocked earlier', (good) => {
    const earlier = goods.filter((other) => GOODS[other].unlockCitizens < GOODS[good].unlockCitizens);
    const best = Math.max(0, ...earlier.map(valuePerChainMinute));
    expect(valuePerChainMinute(good)).toBeGreaterThanOrEqual(best);
  });
});

describe('Upgrade costs', () => {
  const upgradable = (['home', 'workshop', 'factory', 'storehouse', 'silo', 'vault', 'powerPlant', 'waterTower'] satisfies BuildingType[]);

  it.each(upgradable)('%s costs strictly more Urbs at every Tier', (type) => {
    let previous = 0;
    for (let tier = 2; tier <= maxTierOf(type); tier++) {
      const cost = upgradeCostOf(type, tier);
      expect(cost, `${type} Tier ${tier}`).toBeDefined();
      expect(cost!.urbs).toBeGreaterThan(previous);
      previous = cost!.urbs;
    }
  });
});

describe('Late game reach', () => {
  const lastThreshold = Math.max(...Object.values(MATERIALS).map((m) => m.unlockCitizens), ...Object.values(GOODS).map((g) => g.unlockCitizens));

  it('lets a few top-Tier Homes reach the last Unlock threshold', () => {
    expect(Math.ceil(lastThreshold / citizensOf(HOME_TIERS.length))).toBeLessThanOrEqual(3);
  });
});

describe('Specialized storages', () => {
  it('give more capacity per Urb than the Storehouse', () => {
    const perUrb = (type: 'storehouse' | 'silo' | 'vault', compartment: 'materials' | 'goods') => STORAGE_TIERS[type][compartment].base / placementCost(type);
    expect(perUrb('silo', 'materials')).toBeGreaterThan(perUrb('storehouse', 'materials'));
    expect(perUrb('vault', 'goods')).toBeGreaterThan(perUrb('storehouse', 'goods'));
    expect(BUILDING_SPECS.silo.cost).toBeLessThan(BUILDING_SPECS.storehouse.cost);
  });
});
