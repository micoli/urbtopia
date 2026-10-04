import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, CROPS, CROP_IDS, FIELD_COST, GOODS, HOME_TIERS, MATERIALS, PACK_FORMATS, STORAGE_TIERS, citizensOf, maxTierOf, placementCost, producibleItems, upgradeCostOf, type BuildingType, type GoodId } from '../index';

const MINUTE = 60_000;

function chainMinutes(good: GoodId): number {
  const { recipe, durationMs } = GOODS[good];
  const materials = Object.entries(recipe).reduce((total, [material, amount]) => total + MATERIALS[material as keyof typeof MATERIALS].durationMs * amount, 0);
  return (materials + durationMs) / MINUTE;
}

const valuePerChainMinute = (good: GoodId) => GOODS[good].value / chainMinutes(good);

describe('Good values follow the unlock order', () => {
  const goods = (Object.keys(GOODS) as GoodId[]).filter((good) => producibleItems('factory').includes(good));

  it.each(goods)('%s pays at least as much per chain minute as every Good unlocked earlier', (good) => {
    const earlier = goods.filter((other) => GOODS[other].unlockCitizens < GOODS[good].unlockCitizens);
    const best = Math.max(0, ...earlier.map(valuePerChainMinute));
    expect(valuePerChainMinute(good)).toBeGreaterThanOrEqual(best);
  });
});

describe('Upgrade costs', () => {
  const upgradable = (['home', 'workshop', 'factory', 'storehouse', 'silo', 'vault', 'powerPlant', 'waterTower', 'casino'] satisfies BuildingType[]);

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

describe('Farming balance', () => {
  const FIELD_AMORTISED_CYCLES = 20;
  const IN_LINE = { min: 0.6, max: 2.2 };
  const sweepSeeds = (crop: keyof typeof CROPS) => Math.floor((CROPS[crop].yield * Math.round(CROPS[crop].seedShare * 100)) / 100);

  function netPerHour(crop: keyof typeof CROPS): number {
    const spec = CROPS[crop];
    const crates = (spec.yield - sweepSeeds(crop)) / 2;
    const seedShortfall = Math.max(0, 1 - sweepSeeds(crop));
    const net = crates * spec.packedValue - seedShortfall * spec.seedPrice - FIELD_COST / FIELD_AMORTISED_CYCLES;
    return (net / spec.growthMs) * 60 * MINUTE;
  }

  function bestFactoryGoodPerHour(unlockCitizens: number): number {
    const factoryGoods = (producibleItems('factory') as GoodId[]).filter((good) => GOODS[good].unlockCitizens <= unlockCitizens);
    return Math.max(...factoryGoods.map(valuePerChainMinute)) * 60;
  }

  it.each(CROP_IDS)('%s Fields sustain themselves from their own Harvest', (crop) => {
    expect(CROPS[crop].yield * CROPS[crop].seedShare).toBeGreaterThanOrEqual(1);
    expect(sweepSeeds(crop)).toBeGreaterThanOrEqual(1);
  });

  it.each(CROP_IDS)('%s earns per hour in line with a Factory Good of its Unlock stage', (crop) => {
    const ratio = netPerHour(crop) / bestFactoryGoodPerHour(CROPS[crop].unlockCitizens);
    expect(ratio).toBeGreaterThanOrEqual(IN_LINE.min);
    expect(ratio).toBeLessThanOrEqual(IN_LINE.max);
  });

  it('pays more for a packed Good than its Seed pack', () => {
    for (const crop of CROP_IDS) expect(CROPS[crop].packedValue).toBeGreaterThan(CROPS[crop].seedPrice);
  });

  it('keeps packed Goods unlocked with their species', () => {
    for (const crop of CROP_IDS) {
      for (const { suffix } of PACK_FORMATS) expect(GOODS[`${crop}${suffix}`].unlockCitizens).toBe(CROPS[crop].unlockCitizens);
    }
  });

  it('pays bigger packs at least as much per Crop Material', () => {
    const perMaterial = (good: GoodId, size: number) => GOODS[good].value / size;
    for (const crop of CROP_IDS) {
      expect(perMaterial(`${crop}Box`, 5)).toBeGreaterThanOrEqual(perMaterial(`${crop}Crate`, 2));
      expect(perMaterial(`${crop}Pallet`, 10)).toBeGreaterThanOrEqual(perMaterial(`${crop}Box`, 5));
    }
  });
});
