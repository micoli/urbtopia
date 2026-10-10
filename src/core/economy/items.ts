import packFormats from '../../../assets/defs/packFormats.json' with { type: 'json' };
import { entriesOf } from '../defs/entries';
import { CROPS, CROP_IDS, type CropId } from '../farming/crops';
import type { BuildingType } from '../engine/state';
import type { BaseGoodId } from './goodTypes.generated';
import type { GoodCategory, GoodDefinition, MaterialDefinition } from './itemSchemas';
import type { DefinedMaterialId, WorkshopMaterialId } from './materialTypes.generated';

export type { BaseGoodId };
export type BaseMaterialId = WorkshopMaterialId;
export type MaterialId = DefinedMaterialId | CropId;
export type PackSuffix = 'Crate' | 'Box' | 'Pallet';
export type CropCrateId = `${CropId}Crate`;
export type CropBoxId = `${CropId}Box`;
export type CropPalletId = `${CropId}Pallet`;
export type CropPackId = CropCrateId | CropBoxId | CropPalletId;
export type GoodId = BaseGoodId | CropPackId;
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

type MaterialSpec = { durationMs: number; unlockCitizens: number; minTier: number; value: number };

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const materialFiles = import.meta.glob<MaterialDefinition>('../../../assets/defs/materials/*.json', { eager: true, import: 'default' });
const goodFiles = import.meta.glob<GoodDefinition>('../../../assets/defs/goods/*.json', { eager: true, import: 'default' });

export const MATERIAL_ENTRIES = entriesOf<MaterialDefinition, DefinedMaterialId>(materialFiles);
export const GOOD_ENTRIES = entriesOf<GoodDefinition, BaseGoodId>(goodFiles);

const materialSpecOf = ({ durationMinutes, unlockCitizens, minTier, value }: MaterialDefinition): MaterialSpec => ({ durationMs: durationMinutes * MINUTE_MS, unlockCitizens, minTier, value });

const materialsWhere = (keep: (material: MaterialDefinition) => boolean) =>
  Object.fromEntries(MATERIAL_ENTRIES.filter(keep).map(material => [material.id, materialSpecOf(material)]));

const CROP_MATERIALS = Object.fromEntries(
  CROP_IDS.map((id): [CropId, MaterialSpec] => [id, { durationMs: CROPS[id].growthMs, unlockCitizens: CROPS[id].unlockCitizens, minTier: 1, value: 0 }]),
) as Record<CropId, MaterialSpec>;

export const MATERIALS = { ...materialsWhere(({ producedBy }) => producedBy === 'workshop'), ...CROP_MATERIALS, ...materialsWhere(({ producedBy }) => producedBy !== 'workshop') } as Record<MaterialId, MaterialSpec>;

export const FISH_MATERIAL: MaterialSpec = MATERIALS.fish;

export interface GoodSpec {
  category: GoodCategory;
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
  unlockCitizens: number;
  minTier: number;
}

const BASE_GOODS = Object.fromEntries(
  GOOD_ENTRIES.map(({ id, category, recipe, durationMinutes, value, unlockCitizens, minTier }): [BaseGoodId, GoodSpec] => [id, { category, recipe: recipe as GoodSpec['recipe'], durationMs: durationMinutes * MINUTE_MS, value, unlockCitizens, minTier }]),
) as Record<BaseGoodId, GoodSpec>;

export const PACK_FORMATS = packFormats.formats as readonly { suffix: PackSuffix; size: number; valueBonus: number }[];

const CROP_GOODS = Object.fromEntries(
  CROP_IDS.flatMap((id) =>
    PACK_FORMATS.map(({ suffix, size, valueBonus }): [CropPackId, GoodSpec] => [
      `${id}${suffix}`,
      {
        category: 'food',
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

export const CROP_PACK_IDS = Object.keys(CROP_GOODS) as CropPackId[];

export function isMaterial(item: string): item is MaterialId {
  return item in MATERIALS;
}

export function isGood(item: string): item is GoodId {
  return item in GOODS;
}

export function durationOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].durationMs : GOODS[item].durationMs;
}

export function valueOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].value : GOODS[item].value;
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
  workshop: MATERIAL_ENTRIES.filter(({ producedBy }) => producedBy === 'workshop').map(({ id }) => id),
  factory: Object.keys(BASE_GOODS) as BaseGoodId[],
  packhouse: Object.keys(CROP_GOODS) as CropPackId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
