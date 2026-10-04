import { STORAGE_TIERS, type StorageType } from './economy';
import type { GameState, Storage } from '../engine/state';
import { productionTierOf } from './tiers';

interface Compartments {
  materials: number;
  goods: number;
}

const STORAGE_TYPES = Object.keys(STORAGE_TIERS) as StorageType[];

export function isStorageType(type: string): type is StorageType {
  return type in STORAGE_TIERS;
}

export function hasStorage(state: GameState): boolean {
  return state.buildings.some((building) => isStorageType(building.type));
}

export function storageCapacity(state: GameState): Compartments {
  const capacity: Compartments = { materials: 0, goods: 0 };
  const production: Compartments = { materials: 0, goods: 0 };
  for (const building of state.buildings) {
    if (building.type !== 'workshop' && building.type !== 'factory' && building.type !== 'packhouse') continue;
    const compartment = building.type === 'workshop' ? 'materials' : 'goods';
    production[compartment] += building.slotCount * productionTierOf(building).yield;
  }
  for (const building of state.buildings) {
    if (!isStorageType(building.type)) continue;
    const spec = STORAGE_TIERS[building.type];
    const materials = spec.materials.base + (building.tier - 1) * spec.materials.perTier;
    const goods = spec.goods.base + (building.tier - 1) * spec.goods.perTier;
    capacity.materials += building.type === 'storehouse' ? Math.max(materials, production.materials) : materials;
    capacity.goods += building.type === 'storehouse' ? Math.max(goods, production.goods) : goods;
  }
  return capacity;
}

function sum(record: Partial<Record<string, number>>): number {
  return Object.values(record).reduce<number>((total, amount) => total + (amount ?? 0), 0);
}

export function storageUsed(storage: Storage): Compartments {
  return { materials: sum(storage.materials), goods: sum(storage.goods) };
}

export function isStorageEmpty(storage: Storage): boolean {
  const used = storageUsed(storage);
  return used.materials === 0 && used.goods === 0;
}

export function canRemoveStorage(state: GameState, buildingId: number): boolean {
  const remaining: GameState = { ...state, buildings: state.buildings.filter((building) => building.id !== buildingId) };
  const capacity = storageCapacity(remaining);
  const used = storageUsed(state.storage);
  return used.materials <= capacity.materials && used.goods <= capacity.goods;
}

export { STORAGE_TYPES };
