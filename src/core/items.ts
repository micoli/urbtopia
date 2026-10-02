import type { BuildingType } from './state';

export type MaterialId = 'wood' | 'stone';
export type GoodId = 'planks' | 'bricks';
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

export const MATERIALS: Record<MaterialId, { durationMs: number }> = {
  wood: { durationMs: MINUTE_MS },
  stone: { durationMs: 2 * MINUTE_MS },
};

export interface GoodSpec {
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
}

export const GOODS: Record<GoodId, GoodSpec> = {
  planks: { recipe: { wood: 2 }, durationMs: 2 * MINUTE_MS, value: 14 },
  bricks: { recipe: { stone: 2, wood: 1 }, durationMs: 4 * MINUTE_MS, value: 34 },
};

export function isMaterial(item: string): item is MaterialId {
  return item in MATERIALS;
}

export function isGood(item: string): item is GoodId {
  return item in GOODS;
}

export function durationOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].durationMs : GOODS[item].durationMs;
}

export function recipeOf(item: ItemId): Partial<Record<MaterialId, number>> {
  return isGood(item) ? GOODS[item].recipe : {};
}

const PRODUCIBLE_BY_BUILDING: Partial<Record<BuildingType, readonly ItemId[]>> = {
  workshop: Object.keys(MATERIALS) as MaterialId[],
  factory: Object.keys(GOODS) as GoodId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
