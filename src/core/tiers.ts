import {
  HOME_UPGRADE_COSTS,
  PRODUCTION_TIERS,
  PRODUCTION_UPGRADE_COSTS,
  STORAGE_TIERS,
  UTILITY_UPGRADE_COSTS,
  type ProductionTier,
  type UpgradeCostSpec,
} from './economy';
import type { Building, BuildingType } from './state';

export type UpgradeCost = UpgradeCostSpec;

const storageCosts = (type: keyof typeof STORAGE_TIERS): Record<number, UpgradeCost> =>
  Object.fromEntries(STORAGE_TIERS[type].upgradeCosts.map((urbs, index) => [index + 2, { urbs, goods: {} }]));

const UPGRADE_COSTS: Partial<Record<BuildingType, Record<number, UpgradeCost>>> = {
  home: HOME_UPGRADE_COSTS,
  workshop: PRODUCTION_UPGRADE_COSTS,
  factory: PRODUCTION_UPGRADE_COSTS,
  storehouse: storageCosts('storehouse'),
  silo: storageCosts('silo'),
  vault: storageCosts('vault'),
  powerPlant: UTILITY_UPGRADE_COSTS.powerPlant,
  waterTower: UTILITY_UPGRADE_COSTS.waterTower,
};

export function maxTierOf(type: BuildingType): number {
  const costs = UPGRADE_COSTS[type];
  return costs ? Math.max(...Object.keys(costs).map(Number)) : 1;
}

export function upgradeCostOf(type: BuildingType, tier: number): UpgradeCost | undefined {
  return UPGRADE_COSTS[type]?.[tier];
}

export function productionTierOf(building: Pick<Building, 'tier'>): ProductionTier {
  return PRODUCTION_TIERS[building.tier - 1] ?? PRODUCTION_TIERS[0]!;
}
