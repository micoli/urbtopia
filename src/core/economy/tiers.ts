import { BUILDING_ENTRIES, tiersOf } from '../buildings/buildingDefinitions';
import {
  COAL_UPGRADE_COSTS,
  PRODUCTION_UPGRADE_COSTS,
  UTILITY_UPGRADE_COSTS,
  upgradeCostsOf,
  type FarmTier,
  type ProductionTier,
  type UpgradeCostSpec,
} from './economy';
import { FACILITY_TYPES, facilityUpgradeCosts } from '../services/facilities';
import { CASINO } from '../leisure/casino';
import { VENUE_PROFILES } from '../venues/profiles';
import type { Building, BuildingType } from '../engine/state';

export type UpgradeCost = UpgradeCostSpec;

// Buildings defined with Tiers carry their upgrade costs; the others keep a table until they move to data.
const UPGRADE_COSTS: Partial<Record<BuildingType, Record<number, UpgradeCost>>> = {
  powerPlant: UTILITY_UPGRADE_COSTS.powerPlant,
  coalPlant: COAL_UPGRADE_COSTS,
  waterTower: UTILITY_UPGRADE_COSTS.waterTower,
  marina: { 2: PRODUCTION_UPGRADE_COSTS[2]!, 3: PRODUCTION_UPGRADE_COSTS[3]! },
  casino: Object.fromEntries(Object.entries(CASINO.upgradeCosts).map(([tier, urbs]) => [tier, { urbs, goods: {} }])),
  ...Object.fromEntries((['arcade', 'supermarket', 'hotel'] as const).map(type => [type, Object.fromEntries(Object.entries(VENUE_PROFILES[type].upgradeCosts).map(([tier, urbs]) => [tier, { urbs, goods: {} }]))])),
  ...Object.fromEntries(FACILITY_TYPES.map((type) => [type, facilityUpgradeCosts(type)])),
  ...Object.fromEntries(BUILDING_ENTRIES.filter(({ tiers }) => tiers).map(({ id }) => [id, upgradeCostsOf(id)])),
};

export function maxTierOf(type: BuildingType): number {
  const costs = UPGRADE_COSTS[type];
  const tiers = Object.keys(costs ?? {}).map(Number);
  return tiers.length ? Math.max(...tiers) : 1;
}

export function upgradeCostOf(type: BuildingType, tier: number): UpgradeCost | undefined {
  return UPGRADE_COSTS[type]?.[tier];
}

const tierOf = (type: BuildingType, tier: number) => {
  const tiers = tiersOf(type);
  return tiers[tier - 1] ?? tiers[0]!;
};

export function productionTierOf(building: Pick<Building, 'type' | 'tier'>): ProductionTier {
  const { durationFactor, maxSlots, yield: perCycle } = tierOf(building.type, building.tier);
  return { durationFactor: durationFactor!, maxSlots: maxSlots!, yield: perCycle! };
}

export function farmTier(building: Pick<Building, 'type' | 'tier'>): FarmTier {
  const { seedCapacity, fieldCap } = tierOf(building.type, building.tier);
  return { seedCapacity: seedCapacity!, fieldCap: fieldCap! };
}
