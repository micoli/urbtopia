import packFormats from '../../../assets/defs/packFormats.json' with { type: 'json' };
import { entriesOf } from '../defs/entries';
import materialOrder from '../../../assets/defs/order/materials.json' with { type: 'json' };
import goodOrder from '../../../assets/defs/order/goods.json' with { type: 'json' };
import { CROPS, CROP_IDS, type CropId } from '../farming/crops';
import type { BuildingType } from '../engine/state';
import type { BaseGoodId } from './goodTypes.generated';
import type { GoodCategory, GoodDefinition, MaterialDefinition } from './itemSchemas';
import type { DefinedMaterialId, PackableMaterialId } from './materialTypes.generated';

export type { BaseGoodId };
export type BaseMaterialId = DefinedMaterialId;
export type MaterialId = DefinedMaterialId | CropId;
export type PackSuffix = 'Crate' | 'Box' | 'Pallet';
export type PackableId = CropId | PackableMaterialId;
export type CrateId = `${PackableId}Crate`;
export type BoxId = `${PackableId}Box`;
export type PalletId = `${PackableId}Pallet`;
export type PackId = CrateId | BoxId | PalletId;
export type GoodId = BaseGoodId | PackId;
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

type MaterialSpec = { durationMs: number; unlockCitizens: number; minTier: number; value: number; recipe?: Partial<Record<MaterialId, number>> };

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const materialFiles = import.meta.glob<MaterialDefinition>('../../../assets/defs/materials/*.json', { eager: true, import: 'default' });
const goodFiles = import.meta.glob<GoodDefinition>('../../../assets/defs/goods/*.json', { eager: true, import: 'default' });

export const MATERIAL_ENTRIES = entriesOf<MaterialDefinition, DefinedMaterialId>(materialFiles, materialOrder);
export const GOOD_ENTRIES = entriesOf<GoodDefinition, BaseGoodId>(goodFiles, goodOrder);

const materialSpecOf = ({ durationMinutes, unlockCitizens, minTier, value, recipe }: MaterialDefinition): MaterialSpec => ({ durationMs: durationMinutes * MINUTE_MS, unlockCitizens, minTier, value, recipe: recipe as MaterialSpec['recipe'] });

const materialsWhere = (keep: (material: MaterialDefinition) => boolean) =>
  Object.fromEntries(MATERIAL_ENTRIES.filter(keep).map(material => [material.id, materialSpecOf(material)]));

const CROP_MATERIALS = Object.fromEntries(
  CROP_IDS.map((id): [CropId, MaterialSpec] => [id, { durationMs: CROPS[id].growthMs, unlockCitizens: CROPS[id].unlockCitizens, minTier: 1, value: 0 }]),
) as Record<CropId, MaterialSpec>;

export const MATERIALS = { ...materialsWhere(({ producedBy }) => producedBy === 'workshop'), ...CROP_MATERIALS, ...materialsWhere(({ producedBy }) => producedBy !== 'workshop') } as Record<MaterialId, MaterialSpec>;

export const FISH_MATERIAL: MaterialSpec = MATERIALS.fish;

export interface GoodSpec {
  category: GoodCategory;
  producedBy?: 'factory' | 'bakery';
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
  unlockCitizens: number;
  minTier: number;
}

const BASE_GOODS = Object.fromEntries(
  GOOD_ENTRIES.map(({ id, category, producedBy, recipe, durationMinutes, value, unlockCitizens, minTier }): [BaseGoodId, GoodSpec] => [id, { category, producedBy: producedBy ?? 'factory', recipe: recipe as GoodSpec['recipe'], durationMs: durationMinutes * MINUTE_MS, value, unlockCitizens, minTier }]),
) as Record<BaseGoodId, GoodSpec>;

export const PACK_FORMATS = packFormats.formats as readonly { suffix: PackSuffix; size: number; valueBonus: number }[];

interface Packable {
  id: PackableId;
  packingMs: number;
  packedValue: number;
  unlockCitizens: number;
}

const PACKABLES: Packable[] = [
  ...CROP_IDS.map((id): Packable => ({ id, ...CROPS[id] })),
  ...MATERIAL_ENTRIES.flatMap(({ id, packing, unlockCitizens }): Packable[] => (packing ? [{ id: id as PackableMaterialId, packingMs: packing.minutes * MINUTE_MS, packedValue: packing.value, unlockCitizens }] : [])),
];

const PACKED_GOODS = Object.fromEntries(
  PACKABLES.flatMap(({ id, packingMs, packedValue, unlockCitizens }) =>
    PACK_FORMATS.map(({ suffix, size, valueBonus }): [PackId, GoodSpec] => [
      `${id}${suffix}`,
      {
        category: 'food',
        recipe: { [id]: size },
        durationMs: (packingMs * size) / 2,
        value: Math.round((packedValue * size * valueBonus) / 2),
        unlockCitizens,
        minTier: 1,
      },
    ]),
  ),
) as Record<PackId, GoodSpec>;

export const GOODS: Record<GoodId, GoodSpec> = { ...BASE_GOODS, ...PACKED_GOODS };

export const PACK_IDS = Object.keys(PACKED_GOODS) as PackId[];

export function isMaterial(item: string): item is MaterialId {
  return Object.hasOwn(MATERIALS, item);
}

export function isGood(item: string): item is GoodId {
  return Object.hasOwn(GOODS, item);
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
  if (isGood(item)) return GOODS[item].recipe;
  return MATERIALS[item].recipe ?? {};
}

const PRODUCIBLE_BY_BUILDING: Partial<Record<BuildingType, readonly ItemId[]>> = {
  workshop: MATERIAL_ENTRIES.filter(({ producedBy }) => producedBy === 'workshop').map(({ id }) => id),
  mill: MATERIAL_ENTRIES.filter(({ producedBy }) => producedBy === 'mill').map(({ id }) => id),
  factory: Object.entries(BASE_GOODS).filter(([, good]) => good.producedBy === 'factory').map(([id]) => id as BaseGoodId),
  bakery: Object.entries(BASE_GOODS).filter(([, good]) => good.producedBy === 'bakery').map(([id]) => id as BaseGoodId),
  packhouse: Object.keys(PACKED_GOODS) as PackId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
