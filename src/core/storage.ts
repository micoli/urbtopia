import { STORAGE_UPGRADE_BONUS } from './economy';
import type { GameState, Storage } from './state';

export const STORAGE_BASE_CAPACITY = { materials: 20, goods: 40 };

export function hasStorehouse(state: GameState): boolean {
  return state.buildings.some((building) => building.type === 'storehouse');
}

export function storageCapacity(state: GameState): { materials: number; goods: number } {
  if (!hasStorehouse(state)) return { materials: 0, goods: 0 };
  return {
    materials: STORAGE_BASE_CAPACITY.materials + state.storehouseLevel * STORAGE_UPGRADE_BONUS.materials,
    goods: STORAGE_BASE_CAPACITY.goods + state.storehouseLevel * STORAGE_UPGRADE_BONUS.goods,
  };
}

function sum(record: Partial<Record<string, number>>): number {
  return Object.values(record).reduce<number>((total, amount) => total + (amount ?? 0), 0);
}

export function storageUsed(storage: Storage): { materials: number; goods: number } {
  return { materials: sum(storage.materials), goods: sum(storage.goods) };
}

export function isStorageEmpty(storage: Storage): boolean {
  const used = storageUsed(storage);
  return used.materials === 0 && used.goods === 0;
}
