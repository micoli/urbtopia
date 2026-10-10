import { BUILDING_ENTRIES, definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { ShopType } from '../buildings/buildingTypes.generated';
import type { Building } from '../engine/state';
import { SHOP, SLOT_PRICES } from './economy';
import { CROP_PACK_IDS, GOODS, type GoodId } from './items';

export const SHOP_TYPES: readonly ShopType[] = BUILDING_ENTRIES.filter(({ kind }) => kind === 'shop').map(({ id }) => id as ShopType);

export const isShopType = (type: string): type is ShopType => (SHOP_TYPES as readonly string[]).includes(type);

type ShopBuilding = Pick<Building, 'type' | 'tier'>;

export interface ShopTier {
  maxSlots: number;
  sells: readonly GoodId[];
  saleIntervalFactor: number;
  jobs: number;
}

export function shopTierOf(building: ShopBuilding): ShopTier {
  const tiers = tiersOf(building.type as ShopType);
  const { maxSlots, sells, saleIntervalFactor, jobs } = tiers[building.tier - 1] ?? tiers[0]!;
  return { maxSlots: maxSlots!, sells: sells as GoodId[], saleIntervalFactor: saleIntervalFactor!, jobs: jobs! };
}

export const saleIntervalOf = (building: ShopBuilding): number => SHOP.saleIntervalMs * shopTierOf(building).saleIntervalFactor;

// Packed Crops are Food Goods, always sold by a Shop that sells Food.
export function sellableGoodsOf(building: ShopBuilding): readonly GoodId[] {
  const { goodCategory } = definitionOf(building.type as ShopType);
  const packs = goodCategory === 'food' || goodCategory === 'all' ? CROP_PACK_IDS : [];
  return [...shopTierOf(building).sells, ...packs];
}

export const canSell = (building: ShopBuilding, good: GoodId): boolean => good in GOODS && sellableGoodsOf(building).includes(good);

export function slotPriceOf(building: ShopBuilding, slotNumber: number): number {
  const price = SLOT_PRICES[slotNumber] ?? 0;
  return Math.round(price * (definitionOf(building.type as ShopType).slotPriceFactor ?? 1));
}
