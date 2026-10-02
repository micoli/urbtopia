import type { BuildingType } from './state';

export type MaterialId = 'wood' | 'stone';

export type ItemId = MaterialId;

const MINUTE_MS = 60_000;

export const MATERIALS: Record<MaterialId, { durationMs: number }> = {
  wood: { durationMs: MINUTE_MS },
  stone: { durationMs: 2 * MINUTE_MS },
};

export function isMaterial(item: string): item is MaterialId {
  return item in MATERIALS;
}

const PRODUCIBLE_BY_BUILDING: Partial<Record<BuildingType, readonly ItemId[]>> = {
  workshop: Object.keys(MATERIALS) as MaterialId[],
};

export function producibleItems(type: BuildingType): readonly ItemId[] {
  return PRODUCIBLE_BY_BUILDING[type] ?? [];
}
