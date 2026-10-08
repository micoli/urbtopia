import { CROPS, CROP_IDS, type CropId } from '../farming/crops';
import type { BuildingType } from '../engine/state';

export type BaseMaterialId = 'wood' | 'stone' | 'clay' | 'metal' | 'silicon' | 'sand' | 'coal' | 'gold';
export type MaterialId = BaseMaterialId | CropId | 'fish';
export type BaseGoodId = 'planks' | 'cannedFish' | 'bricks' | 'tiles' | 'tools' | 'glass' | 'circuits' | 'steel' | 'cement' | 'jewelry' | 'crystal';
export type CropCrateId = `${CropId}Crate`;
export type CropBoxId = `${CropId}Box`;
export type CropPalletId = `${CropId}Pallet`;
export type CropPackId = CropCrateId | CropBoxId | CropPalletId;
export type GoodId = BaseGoodId | CropPackId;
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

type MaterialSpec = { durationMs: number; unlockCitizens: number; minTier: number };

const BASE_MATERIALS: Record<BaseMaterialId, MaterialSpec> = {
  wood: { durationMs: 1 * MINUTE_MS, unlockCitizens: 0, minTier: 1 },
  stone: { durationMs: 2 * MINUTE_MS, unlockCitizens: 0, minTier: 1 },
  clay: { durationMs: 4 * MINUTE_MS, unlockCitizens: 30, minTier: 1 },
  metal: { durationMs: 8 * MINUTE_MS, unlockCitizens: 80, minTier: 1 },
  silicon: { durationMs: 16 * MINUTE_MS, unlockCitizens: 200, minTier: 5 },
  sand: { durationMs: 24 * MINUTE_MS, unlockCitizens: 350, minTier: 4 },
  coal: { durationMs: 32 * MINUTE_MS, unlockCitizens: 600, minTier: 4 },
  gold: { durationMs: 48 * MINUTE_MS, unlockCitizens: 1000, minTier: 5 },
};

const CROP_MATERIALS = Object.fromEntries(
  CROP_IDS.map((id): [CropId, MaterialSpec] => [id, { durationMs: CROPS[id].growthMs, unlockCitizens: CROPS[id].unlockCitizens, minTier: 1 }]),
) as Record<CropId, MaterialSpec>;

export const FISH_MATERIAL: MaterialSpec = { durationMs: 6 * MINUTE_MS, unlockCitizens: 100, minTier: 1 };

export const MATERIALS: Record<MaterialId, MaterialSpec> = { ...BASE_MATERIALS, ...CROP_MATERIALS, fish: FISH_MATERIAL };

export interface GoodSpec {
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
  unlockCitizens: number;
  minTier: number;
}

const BASE_GOODS: Record<BaseGoodId, GoodSpec> = {
  planks: { recipe: { wood: 2 }, durationMs: 2 * MINUTE_MS, value: 14, unlockCitizens: 0, minTier: 1 },
  cannedFish: { recipe: { fish: 2 }, durationMs: 5 * MINUTE_MS, value: 80, unlockCitizens: 100, minTier: 1 },
  bricks: { recipe: { stone: 2, wood: 1 }, durationMs: 4 * MINUTE_MS, value: 34, unlockCitizens: 0, minTier: 1 },
  tiles: { recipe: { clay: 2 }, durationMs: 6 * MINUTE_MS, value: 62, unlockCitizens: 30, minTier: 1 },
  tools: { recipe: { metal: 1, wood: 1 }, durationMs: 8 * MINUTE_MS, value: 80, unlockCitizens: 80, minTier: 1 },
  glass: { recipe: { clay: 2, silicon: 1 }, durationMs: 12 * MINUTE_MS, value: 190, unlockCitizens: 200, minTier: 5 },
  circuits: { recipe: { metal: 1, silicon: 1 }, durationMs: 16 * MINUTE_MS, value: 230, unlockCitizens: 200, minTier: 5 },
  steel: { recipe: { coal: 1, metal: 1 }, durationMs: 20 * MINUTE_MS, value: 420, unlockCitizens: 600, minTier: 4 },
  cement: { recipe: { sand: 1, stone: 2 }, durationMs: 14 * MINUTE_MS, value: 270, unlockCitizens: 350, minTier: 4 },
  jewelry: { recipe: { gold: 1, clay: 2 }, durationMs: 24 * MINUTE_MS, value: 600, unlockCitizens: 1000, minTier: 5 },
  crystal: { recipe: { sand: 1, gold: 1 }, durationMs: 28 * MINUTE_MS, value: 850, unlockCitizens: 1000, minTier: 5 },
};

export const PACK_FORMATS = [
  { suffix: 'Crate', size: 2, valueBonus: 1 },
  { suffix: 'Box', size: 5, valueBonus: 1.1 },
  { suffix: 'Pallet', size: 10, valueBonus: 1.25 },
] as const;

const CROP_GOODS = Object.fromEntries(
  CROP_IDS.flatMap((id) =>
    PACK_FORMATS.map(({ suffix, size, valueBonus }): [CropPackId, GoodSpec] => [
      `${id}${suffix}`,
      {
        recipe: { [id]: size },
        durationMs: (CROPS[id].packingMs * size) / 2,
        value: Math.round((CROPS[id].packedValue * size * valueBonus) / 2),
        unlockCitizens: CROPS[id].unlockCitizens,
        minTier: 1,
      },
    ]),
  ),
) as Record<CropPackId, GoodSpec>;

export const GOODS: Record<GoodId, GoodSpec> = { ...BASE_GOODS, ...CROP_GOODS };

export function isMaterial(item: string): item is MaterialId {
  return item in MATERIALS;
}

export function isGood(item: string): item is GoodId {
  return item in GOODS;
}

export function durationOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].durationMs : GOODS[item].durationMs;
}

export function unlockCitizensOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].unlockCitizens : GOODS[item].unlockCitizens;
}

export function minTierOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].minTier : GOODS[item].minTier;
}

export function recipeOf(item: ItemId): Partial<Record<MaterialId, number>> {
  return isGood(item) ? GOODS[item].recipe : {};
}

const PRODUCIBLE_BY_BUILDING: Partial<Record<BuildingType, readonly ItemId[]>> = {
  workshop: Object.keys(BASE_MATERIALS) as BaseMaterialId[],
  factory: Object.keys(BASE_GOODS) as BaseGoodId[],
  packhouse: Object.keys(CROP_GOODS) as CropPackId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
