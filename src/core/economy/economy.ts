import { tiersOf } from '../buildings/buildingDefinitions';
import type { GoodId } from './items';

export const MAX_SLOTS = 5;

export const SLOT_PRICES: Record<number, number> = { 3: 500, 4: 1500, 5: 4000, 6: 8000, 7: 12000, 8: 20000 };

export interface UpgradeCostSpec {
  urbs: number;
  goods: Partial<Record<GoodId, number>>;
}

export interface ProductionTier {
  durationFactor: number;
  maxSlots: number;
  yield: number;
}

export const PRODUCTION_TIERS: readonly ProductionTier[] = [
  { durationFactor: 1, maxSlots: 5, yield: 1 },
  { durationFactor: 0.75, maxSlots: 5, yield: 1 },
  { durationFactor: 0.75, maxSlots: 8, yield: 1 },
  { durationFactor: 0.75, maxSlots: 8, yield: 2 },
  { durationFactor: 0.75, maxSlots: 8, yield: 2 },
];

export const PRODUCTION_UPGRADE_COSTS: Record<number, UpgradeCostSpec> = {
  2: { urbs: 300, goods: { planks: 3 } },
  3: { urbs: 800, goods: { bricks: 4 } },
  4: { urbs: 2000, goods: { tiles: 4 } },
  5: { urbs: 5000, goods: { tools: 4 } },
};

export interface FarmTier {
  seedCapacity: number;
  fieldCap: number;
}

export const FARM_TIERS: readonly FarmTier[] = [
  { seedCapacity: 20, fieldCap: 12 },
  { seedCapacity: 40, fieldCap: 24 },
  { seedCapacity: 70, fieldCap: 40 },
  { seedCapacity: 110, fieldCap: 60 },
  { seedCapacity: 160, fieldCap: 90 },
];

export type StorageType = 'storehouse' | 'silo' | 'vault' | 'grainSilo';

interface CompartmentCapacity {
  base: number;
  perTier: number;
}

const NO_CAPACITY: CompartmentCapacity = { base: 0, perTier: 0 };

export const STORAGE_TIERS: Record<StorageType, { materials: CompartmentCapacity; goods: CompartmentCapacity; crops: CompartmentCapacity; upgradeCosts: readonly number[] }> = {
  storehouse: { materials: { base: 20, perTier: 10 }, goods: { base: 40, perTier: 20 }, crops: NO_CAPACITY, upgradeCosts: [300, 800, 2000, 5000, 12000] },
  silo: { materials: { base: 40, perTier: 20 }, goods: NO_CAPACITY, crops: NO_CAPACITY, upgradeCosts: [250, 600, 1500, 4000, 9000] },
  vault: { materials: NO_CAPACITY, goods: { base: 80, perTier: 40 }, crops: NO_CAPACITY, upgradeCosts: [250, 600, 1500, 4000, 9000] },
  grainSilo: { materials: NO_CAPACITY, goods: NO_CAPACITY, crops: { base: 40, perTier: 20 }, upgradeCosts: [250, 600, 1500, 4000, 9000] },
};

export const FARM_CROP_CAPACITY = 10;

export const SHOP = { stackSize: 5, saleIntervalMs: 45_000 };

export const MARKET = {
  fullPoints: 60,
  floorPoints: 30,
  pointsLostPerUnit: 5,
  recoveryMs: 60 * 60_000,
};

export const PARCEL_PRICING = { base: 300, factor: 1.12, roundTo: 10 };

export const HOME_TIERS: readonly { citizens: number; power: number; water: number }[] = tiersOf('home').map(({ citizens, power, water }) => ({ citizens: citizens!, power: power!, water: water! }));

export const UTILITY_CAPACITY: Record<'powerPlant' | 'waterTower', readonly number[]> = {
  powerPlant: [12, 24, 40],
  waterTower: [12, 24, 40],
};

export const COAL_CAPACITY: readonly number[] = [12, 24, 40, 64];

export const COAL_UPGRADE_COSTS: Record<number, UpgradeCostSpec> = {
  2: { urbs: 300, goods: {} },
  3: { urbs: 900, goods: {} },
  4: { urbs: 1800, goods: {} },
};

export const UTILITY_UPGRADE_COSTS: Record<'powerPlant' | 'waterTower', Record<number, UpgradeCostSpec>> = {
  powerPlant: { 2: { urbs: 500, goods: { bricks: 3 } }, 3: { urbs: 1500, goods: { tools: 3 } } },
  waterTower: { 2: { urbs: 400, goods: { bricks: 3 } }, 3: { urbs: 1200, goods: { tools: 3 } } },
};

export const TAX = { urbsPerCitizenPerHour: 1, capHours: 8, hourMs: 3_600_000 };

const HOME_TIER_LIST = tiersOf('home');

export const HOME_FOOTPRINTS: readonly { width: number; depth: number }[] = HOME_TIER_LIST.map(({ footprint }) => ({ width: footprint![0], depth: footprint![1] }));

export const HOME_UPGRADE_COSTS: Record<number, UpgradeCostSpec> = Object.fromEntries(
  HOME_TIER_LIST.flatMap(({ upgradeCost }, index) => (upgradeCost ? [[index + 1, { urbs: upgradeCost.urbs, goods: (upgradeCost.goods ?? {}) as UpgradeCostSpec['goods'] }]] : [])),
);

export const MAX_HOME_TIER = HOME_TIER_LIST.length;
