import type { Building } from '../engine/state';
import { FACILITIES, facilityCapacity, isFacilityType } from '../services/facilities';

export const JOBS = {
  workshopPerTier: 25,
  factoryPerTier: 25,
  shop: 15,
  casinoPerTier: 15,
  facilityCapacityDivisor: 40,
  uncappedFacility: 40,
};

export function jobsOf(building: Building): number {
  switch (building.type) {
    case 'workshop':
      return JOBS.workshopPerTier * building.tier;
    case 'factory':
      return JOBS.factoryPerTier * building.tier;
    case 'shop':
      return JOBS.shop;
    case 'casino':
      return JOBS.casinoPerTier * building.tier;
  }
  if (!isFacilityType(building.type)) return 0;
  const capacity = FACILITIES[building.type].capacity === null ? null : facilityCapacity(building.type, building.tier);
  return capacity === null ? JOBS.uncappedFacility : Math.round(capacity / JOBS.facilityCapacityDivisor);
}
