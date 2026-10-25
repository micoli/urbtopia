import type { BuildingType } from '../engine/state';
import { durationOf, type ItemId } from './items';

interface Orchard {
  item: ItemId;
  cycleMs: number;
  // An orchard tree takes one unit of water; a Hive takes none.
  water: boolean;
}

const TREE_CYCLE_MS = 20 * 60_000;

const ORCHARDS: Partial<Record<BuildingType, Orchard>> = {
  oliveTree: { item: 'olive', cycleMs: TREE_CYCLE_MS, water: true },
  appleTree: { item: 'apple', cycleMs: TREE_CYCLE_MS, water: true },
  cherryTree: { item: 'cherry', cycleMs: TREE_CYCLE_MS, water: true },
  mulberryTree: { item: 'mulberryLeaf', cycleMs: durationOf('mulberryLeaf'), water: true },
  hive: { item: 'honey', cycleMs: durationOf('honey'), water: false },
};

export const orchardOf = (type: BuildingType): Orchard | undefined => ORCHARDS[type];

export const orchardWaterDemandOf = (type: BuildingType): number => (ORCHARDS[type]?.water ? 1 : 0);

export const newOrchardQueue = (type: BuildingType, startedAt: number) => {
  const orchard = ORCHARDS[type];
  return orchard ? [{ item: orchard.item, duration: orchard.cycleMs, startedAt, done: false, quantity: 1 }] : undefined;
};
