import { interiorBonusOfBuilding } from '../factory/factoryInterior';
import { interiorFillRate } from '../interiors/interiorParts';
import { FARM_CROP_CAPACITY, STORAGE_TYPES, storageTierOf, type StorageType } from './economy';
import { CROPS } from '../farming/crops';
import type { GameState, Storage } from '../engine/state';
import { isMaterial, isOrchardMaterial } from './items';
import { compartmentProducedBy, isProductionType } from './productionTypes';
import { maxQuantityOf } from './production';


interface Compartments {
  materials: number;
  crops: number;
  goods: number;
}

export type Compartment = keyof Compartments;

const STORAGE_SET: ReadonlySet<string> = new Set(STORAGE_TYPES);

export function isStorageType(type: string): type is StorageType {
  return STORAGE_SET.has(type);
}

export function hasStorage(state: GameState): boolean {
  return state.buildings.some((building) => isStorageType(building.type));
}

// What the stocker of a Storehouse adds to what it holds: the room its linked racks make, in proportion to the Staff that Citizens fill.
function roomBonusOf(state: GameState, building: GameState['buildings'][number]): number {
  if (!building.interior) return 0;
  const bonus = interiorBonusOfBuilding(building).capacity ?? 0;
  return bonus === 0 ? 0 : bonus * interiorFillRate(state, building);
}

export function storageCapacity(state: GameState): Compartments {
  const farms = state.buildings.filter((building) => building.type === 'farm').length;
  const capacity: Compartments = { materials: 0, crops: farms * FARM_CROP_CAPACITY, goods: 0 };
  const production: Compartments = { materials: 0, crops: 0, goods: 0 };
  for (const building of state.buildings) {
    if (!isProductionType(building.type)) continue;
    const compartment = compartmentProducedBy(building.type);
    production[compartment] += building.slotCount * maxQuantityOf(building);
  }
  for (const building of state.buildings) {
    if (!isStorageType(building.type)) continue;
    const { materials, goods, crops } = storageTierOf(building.type, building.tier);
    const room = 1 + roomBonusOf(state, building);
    capacity.crops += Math.floor(crops * room);
    capacity.materials += Math.floor(materials * room);
    capacity.goods += Math.floor(goods * room);
  }
  if (state.buildings.some((building) => building.type === 'storehouse')) {
    capacity.materials = Math.max(capacity.materials, production.materials);
    capacity.goods = Math.max(capacity.goods, production.goods);
  }
  return capacity;
}

function sum(record: Partial<Record<string, number>>): number {
  return Object.values(record).reduce<number>((total, amount) => total + (amount ?? 0), 0);
}

const isCropCompartmentItem = (item: string): boolean => Object.hasOwn(CROPS, item) || isOrchardMaterial(item);

export function compartmentOf(item: string): Compartment {
  if (isCropCompartmentItem(item)) return 'crops';
  return isMaterial(item) ? 'materials' : 'goods';
}

export function storageUsed(storage: Storage): Compartments {
  const cropStock = Object.fromEntries(Object.entries(storage.materials).filter(([item]) => isCropCompartmentItem(item)));
  const crops = sum(cropStock);
  return { materials: sum(storage.materials) - crops, crops, goods: sum(storage.goods) };
}

export function isStorageEmpty(storage: Storage): boolean {
  const used = storageUsed(storage);
  return used.materials === 0 && used.crops === 0 && used.goods === 0;
}

export function canRemoveStorage(state: GameState, buildingId: number): boolean {
  const remaining: GameState = { ...state, buildings: state.buildings.filter((building) => building.id !== buildingId) };
  const capacity = storageCapacity(remaining);
  const used = storageUsed(state.storage);
  return used.materials <= capacity.materials && used.crops <= capacity.crops && used.goods <= capacity.goods;
}

export { STORAGE_TYPES };
