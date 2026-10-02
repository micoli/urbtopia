import type { BuildingType } from './state';

export type MaterialId = 'wood' | 'stone' | 'clay' | 'metal' | 'silicon';
export type GoodId = 'planks' | 'bricks' | 'tiles' | 'tools' | 'glass' | 'circuits';
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

export const MATERIALS: Record<MaterialId, { durationMs: number; unlockCitizens: number }> = {
  wood: { durationMs: 1 * MINUTE_MS, unlockCitizens: 0 },
  stone: { durationMs: 2 * MINUTE_MS, unlockCitizens: 0 },
  clay: { durationMs: 4 * MINUTE_MS, unlockCitizens: 30 },
  metal: { durationMs: 8 * MINUTE_MS, unlockCitizens: 80 },
  silicon: { durationMs: 16 * MINUTE_MS, unlockCitizens: 200 },
};

export interface GoodSpec {
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
  unlockCitizens: number;
}

export const GOODS: Record<GoodId, GoodSpec> = {
  planks: { recipe: { wood: 2 }, durationMs: 2 * MINUTE_MS, value: 14, unlockCitizens: 0 },
  bricks: { recipe: { stone: 2, wood: 1 }, durationMs: 4 * MINUTE_MS, value: 34, unlockCitizens: 0 },
  tiles: { recipe: { clay: 2 }, durationMs: 6 * MINUTE_MS, value: 62, unlockCitizens: 30 },
  tools: { recipe: { metal: 1, wood: 1 }, durationMs: 8 * MINUTE_MS, value: 80, unlockCitizens: 80 },
  glass: { recipe: { clay: 2, silicon: 1 }, durationMs: 12 * MINUTE_MS, value: 190, unlockCitizens: 200 },
  circuits: { recipe: { metal: 1, silicon: 1 }, durationMs: 16 * MINUTE_MS, value: 230, unlockCitizens: 200 },
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

export function unlockCitizensOf(item: ItemId): number {
  return isMaterial(item) ? MATERIALS[item].unlockCitizens : GOODS[item].unlockCitizens;
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
