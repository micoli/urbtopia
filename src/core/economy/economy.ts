import economy from '../../../assets/defs/balance/economy.json' with { type: 'json' };
import { BUILDING_ENTRIES, tiersOf } from '../buildings/buildingDefinitions';
import type { BuildingId, StorageType } from '../buildings/buildingTypes.generated';
import type { GoodId } from './items';

const MINUTE_MS = 60_000;

export const MAX_SLOTS = 5;

export const SLOT_PRICES: Record<number, number> = economy.slotPrices;

export interface UpgradeCostSpec {
  urbs: number;
  goods: Partial<Record<GoodId, number>>;
}

export interface ProductionTier {
  durationFactor: number;
  maxSlots: number;
  yield: number;
}

// Every production building has Tiers of its own; these follow the Workshop, for the facts shown without a building.
export const PRODUCTION_TIERS: readonly ProductionTier[] = tiersOf('workshop').map(({ durationFactor, maxSlots, yield: perCycle }) => ({ durationFactor: durationFactor!, maxSlots: maxSlots!, yield: perCycle! }));

export const upgradeCostsOf = (type: BuildingId): Record<number, UpgradeCostSpec> =>
  Object.fromEntries(tiersOf(type).flatMap(({ upgradeCost }, index) => (upgradeCost ? [[index + 1, { urbs: upgradeCost.urbs, goods: (upgradeCost.goods ?? {}) as UpgradeCostSpec['goods'] }]] : [])));

export const PRODUCTION_UPGRADE_COSTS: Record<number, UpgradeCostSpec> = upgradeCostsOf('workshop');

export interface FarmTier {
  seedCapacity: number;
  fieldCap: number;
}

export const FARM_TIERS: readonly FarmTier[] = tiersOf('farm').map(({ seedCapacity, fieldCap }) => ({ seedCapacity: seedCapacity!, fieldCap: fieldCap! }));

export type { StorageType };

export interface StorageTier {
  materials: number;
  goods: number;
  crops: number;
}

export const STORAGE_TYPES = BUILDING_ENTRIES.filter(({ kind }) => kind === 'storage').map(({ id }) => id as StorageType);

// The capacity a storage of this Tier adds to each compartment.
export function storageTierOf(type: StorageType, tier: number): StorageTier {
  const tiers = tiersOf(type);
  const { materials, goods, crops } = tiers[tier - 1] ?? tiers[0]!;
  return { materials: materials!, goods: goods!, crops: crops! };
}

export const FARM_CROP_CAPACITY = 10;

export const SHOP = { stackSize: economy.shop.stackSize, saleIntervalMs: economy.shop.saleIntervalMinutes * MINUTE_MS };

export const MARKET = {
  fullPoints: economy.market.fullPoints,
  floorPoints: economy.market.floorPoints,
  pointsLostPerUnit: economy.market.pointsLostPerUnit,
  recoveryMs: economy.market.recoveryMinutes * MINUTE_MS,
};

export const RUSH = economy.rush;

export const PARCEL_PRICING = economy.parcelPricing;

export const HOME_TIERS: readonly { citizens: number; power: number; water: number }[] = tiersOf('home').map(({ citizens, power, water }) => ({ citizens: citizens!, power: power!, water: water! }));

const capacitiesOf = (type: BuildingId): readonly number[] => tiersOf(type).map(({ capacity }) => capacity!);

export const UTILITY_CAPACITY: Record<'powerPlant' | 'waterTower', readonly number[]> = { powerPlant: capacitiesOf('powerPlant'), waterTower: capacitiesOf('waterTower') };

export const COAL_CAPACITY: readonly number[] = capacitiesOf('coalPlant');



export const TAX = { ...economy.tax, hourMs: 3_600_000 };

const HOME_TIER_LIST = tiersOf('home');

export const HOME_FOOTPRINTS: readonly { width: number; depth: number }[] = HOME_TIER_LIST.map(({ footprint }) => ({ width: footprint![0], depth: footprint![1] }));

export const HOME_UPGRADE_COSTS: Record<number, UpgradeCostSpec> = upgradeCostsOf('home');

export const MAX_HOME_TIER = HOME_TIER_LIST.length;
