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
