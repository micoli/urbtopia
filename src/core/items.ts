import type { BuildingType } from './state';

export type MaterialId = 'wood' | 'stone' | 'clay' | 'metal' | 'silicon' | 'sand' | 'coal' | 'gold';
export type GoodId = 'planks' | 'bricks' | 'tiles' | 'tools' | 'glass' | 'circuits' | 'steel' | 'cement' | 'jewelry' | 'crystal';
export type ItemId = MaterialId | GoodId;

const MINUTE_MS = 60_000;

export const MATERIALS: Record<MaterialId, { durationMs: number; unlockCitizens: number; minTier: number }> = {
  wood: { durationMs: 1 * MINUTE_MS, unlockCitizens: 0, minTier: 1 },
  stone: { durationMs: 2 * MINUTE_MS, unlockCitizens: 0, minTier: 1 },
  clay: { durationMs: 4 * MINUTE_MS, unlockCitizens: 30, minTier: 1 },
  metal: { durationMs: 8 * MINUTE_MS, unlockCitizens: 80, minTier: 1 },
  silicon: { durationMs: 16 * MINUTE_MS, unlockCitizens: 200, minTier: 5 },
  sand: { durationMs: 24 * MINUTE_MS, unlockCitizens: 350, minTier: 4 },
  coal: { durationMs: 32 * MINUTE_MS, unlockCitizens: 600, minTier: 4 },
  gold: { durationMs: 48 * MINUTE_MS, unlockCitizens: 1000, minTier: 5 },
};

export interface GoodSpec {
  recipe: Partial<Record<MaterialId, number>>;
  durationMs: number;
  value: number;
  unlockCitizens: number;
  minTier: number;
}

export const GOODS: Record<GoodId, GoodSpec> = {
  planks: { recipe: { wood: 2 }, durationMs: 2 * MINUTE_MS, value: 14, unlockCitizens: 0, minTier: 1 },
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
  workshop: Object.keys(MATERIALS) as MaterialId[],
  factory: Object.keys(GOODS) as GoodId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
