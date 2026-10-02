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
