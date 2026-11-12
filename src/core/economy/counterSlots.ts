import { BUILDING_ENTRIES, tiersOf } from '../buildings/buildingDefinitions';
import type { BuildingId } from '../buildings/buildingTypes.generated';

const counterOf = (type: string) => BUILDING_ENTRIES.find(({ id }) => id === type)?.counter;

export const hasCounter = (type: string): boolean => counterOf(type) !== undefined;

// The sales Slots of a counter: the Tier's own number when its Tiers give one, else the number of the counter.
export const stackCountOf = (type: string, tier = 1): number => {
  const counter = counterOf(type);
  if (!counter) return 0;
  return tiersOf(type as BuildingId)[tier - 1]?.counterSlots ?? counter.slots;
};
