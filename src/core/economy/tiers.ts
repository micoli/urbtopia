import {
  HOME_UPGRADE_COSTS,
  COAL_UPGRADE_COSTS,
  FARM_TIERS,
  PRODUCTION_TIERS,
  PRODUCTION_UPGRADE_COSTS,
  STORAGE_TIERS,
  UTILITY_UPGRADE_COSTS,
  type FarmTier,
  type ProductionTier,
  type UpgradeCostSpec,
} from './economy';
import { FACILITY_TYPES, facilityUpgradeCosts } from '../services/facilities';
import { CASINO } from '../leisure/casino';
import type { Building, BuildingType } from '../engine/state';

export type UpgradeCost = UpgradeCostSpec;

const storageCosts = (type: keyof typeof STORAGE_TIERS): Record<number, UpgradeCost> =>
  Object.fromEntries(STORAGE_TIERS[type].upgradeCosts.map((urbs, index) => [index + 2, { urbs, goods: {} }]));

const UPGRADE_COSTS: Partial<Record<BuildingType, Record<number, UpgradeCost>>> = {
  home: HOME_UPGRADE_COSTS,
  workshop: PRODUCTION_UPGRADE_COSTS,
  factory: PRODUCTION_UPGRADE_COSTS,
  storehouse: storageCosts('storehouse'),
  farm: PRODUCTION_UPGRADE_COSTS,
  packhouse: PRODUCTION_UPGRADE_COSTS,
  silo: storageCosts('silo'),
  vault: storageCosts('vault'),
  grainSilo: storageCosts('grainSilo'),
  powerPlant: UTILITY_UPGRADE_COSTS.powerPlant,
  coalPlant: COAL_UPGRADE_COSTS,
  waterTower: UTILITY_UPGRADE_COSTS.waterTower,
  marina: { 2: PRODUCTION_UPGRADE_COSTS[2]!, 3: PRODUCTION_UPGRADE_COSTS[3]! },
  casino: Object.fromEntries(Object.entries(CASINO.upgradeCosts).map(([tier, urbs]) => [tier, { urbs, goods: {} }])),
  ...Object.fromEntries(FACILITY_TYPES.map((type) => [type, facilityUpgradeCosts(type)])),
};

export function maxTierOf(type: BuildingType): number {
  const costs = UPGRADE_COSTS[type];
  const tiers = Object.keys(costs ?? {}).map(Number);
  return tiers.length ? Math.max(...tiers) : 1;
}

export function upgradeCostOf(type: BuildingType, tier: number): UpgradeCost | undefined {
  return UPGRADE_COSTS[type]?.[tier];
}

export function productionTierOf(building: Pick<Building, 'tier'>): ProductionTier {
  return PRODUCTION_TIERS[building.tier - 1] ?? PRODUCTION_TIERS[0]!;
}

export function farmTier(building: Pick<Building, 'tier'>): FarmTier {
  return FARM_TIERS[building.tier - 1] ?? FARM_TIERS[0]!;
}
