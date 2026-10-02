import type { GoodId } from './items';

export const MAX_SLOTS = 5;

export const SLOT_PRICES: Record<number, number> = { 3: 500, 4: 1500, 5: 4000 };

export const STORAGE_UPGRADE_COSTS: readonly number[] = [300, 800, 2000, 5000, 12000];

export const STORAGE_UPGRADE_BONUS = { materials: 10, goods: 20 };

export const SHOP = { stackSize: 5, saleIntervalMs: 45_000 };

export const MARKET = {
  fullPoints: 60,
  floorPoints: 30,
  pointsLostPerUnit: 5,
  recoveryMs: 60 * 60_000,
};

export const PARCEL_PRICING = { base: 300, factor: 1.12, roundTo: 10 };

export const HOME_TIERS: readonly { citizens: number; power: number; water: number }[] = [
  { citizens: 6, power: 1, water: 1 },
  { citizens: 15, power: 2, water: 2 },
  { citizens: 32, power: 3, water: 3 },
  { citizens: 60, power: 6, water: 6 },
  { citizens: 100, power: 10, water: 10 },
  { citizens: 160, power: 16, water: 16 },
];

export const UTILITY_CAPACITY = { powerPlant: 12, waterTower: 12 };

export const TAX = { urbsPerCitizenPerHour: 1, capHours: 8, hourMs: 3_600_000 };

export const HOME_FOOTPRINTS: readonly { width: number; depth: number }[] = [
  { width: 1, depth: 1 },
  { width: 2, depth: 1 },
  { width: 2, depth: 1 },
  { width: 2, depth: 1 },
  { width: 2, depth: 2 },
  { width: 2, depth: 2 },
];

export const HOME_UPGRADE_COSTS: Record<number, { urbs: number; goods: Partial<Record<GoodId, number>> }> = {
  2: { urbs: 150, goods: { planks: 3 } },
  3: { urbs: 400, goods: { bricks: 4, planks: 2 } },
  4: { urbs: 1000, goods: { tiles: 4, bricks: 3 } },
  5: { urbs: 2500, goods: { tools: 4, tiles: 3 } },
  6: { urbs: 6000, goods: { glass: 4, circuits: 3 } },
};

export const MAX_HOME_TIER = 6;
