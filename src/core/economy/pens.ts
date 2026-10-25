import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { Building } from '../engine/state';
import { modelFileOf } from '../models/modelFiles';
import { MATERIAL_ENTRIES } from './items';

export interface PenAnimal {
  // Offsets from the center of the footprint, in tiles.
  x: number;
  z: number;
  // The Model id of the animal.
  animal: string;
}

const ANIMAL_OF_ITEM = new Map<string, string>(MATERIAL_ENTRIES.flatMap(({ id, animal }) => (animal ? [[id, animal]] : [])));

// Every production in the queue, running, waiting for its Slot or waiting to be collected, puts its animal in the next Pen.
export function penAnimalsOf(building: Pick<Building, 'type' | 'tier' | 'queue'>): PenAnimal[] {
  const pens = definitionOf(building.type)?.pens;
  if (!pens) return [];
  const available = pens.slice(0, tiersOf(building.type)[building.tier - 1]?.penCount ?? pens.length);
  const animals = building.queue.flatMap((entry) => ANIMAL_OF_ITEM.get(entry.item) ?? []);
  return available.flatMap((pen, index) => (animals[index] ? [{ ...pen, animal: animals[index] }] : []));
}

export const ANIMAL_MODEL_FILES: readonly string[] = [...new Set(ANIMAL_OF_ITEM.values())].map(modelFileOf);
