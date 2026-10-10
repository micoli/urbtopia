import type { Building, BuildingType } from '../engine/state';
import { totalStaff } from '../venues/staff';
import { VENUE_TYPES, isVenueType } from '../venues/profiles';
import { SHOP_TYPES, isShopType, shopTierOf } from '../economy/shops';
import { FACILITIES, FACILITY_TYPES, facilityCapacity, isFacilityType } from '../services/facilities';

export const workplaceTypes: readonly BuildingType[] = ['workshop', 'factory', ...SHOP_TYPES, 'casino', ...VENUE_TYPES, ...FACILITY_TYPES];

export const JOBS = {
  workshopPerTier: 25,
  factoryPerTier: 25,
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
    case 'casino':
      return JOBS.casinoPerTier * building.tier;
  }
  if (isShopType(building.type)) return shopTierOf(building).jobs;
  if (isVenueType(building.type)) return building.venue ? totalStaff(building.venue) : 0;
  if (!isFacilityType(building.type)) return 0;
  const capacity = FACILITIES[building.type].capacity === null ? null : facilityCapacity(building.type, building.tier);
  return capacity === null ? JOBS.uncappedFacility : Math.round(capacity / JOBS.facilityCapacityDivisor);
}
