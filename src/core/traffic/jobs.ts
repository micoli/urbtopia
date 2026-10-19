import type { Building, BuildingType } from '../engine/state';
import { totalStaff } from '../venues/staff';
import { VENUE_TYPES, isVenueType } from '../venues/profiles';
import { INDUSTRY_TYPES, industryWeightOf } from '../economy/productionTypes';
import { SHOP_TYPES, isShopType, shopTierOf } from '../economy/shops';
import { FACILITIES, FACILITY_TYPES, facilityCapacity, isFacilityType } from '../services/facilities';

export const workplaceTypes: readonly BuildingType[] = [...INDUSTRY_TYPES, ...SHOP_TYPES, 'casino', ...VENUE_TYPES, ...FACILITY_TYPES];

export const JOBS = {
  workshopPerTier: 25,
  factoryPerTier: 25,
  casinoPerTier: 15,
  facilityCapacityDivisor: 40,
  uncappedFacility: 40,
};

export function jobsOf(building: Building): number {
  if (building.type === 'casino') return JOBS.casinoPerTier * building.tier;
  const weight = industryWeightOf(building.type);
  if (weight > 0) return (weight === 1 ? JOBS.workshopPerTier : JOBS.factoryPerTier) * building.tier;
  if (isShopType(building.type)) return shopTierOf(building).jobs;
  if (isVenueType(building.type)) return building.venue ? totalStaff(building.venue) : 0;
  if (!isFacilityType(building.type)) return 0;
  const capacity = FACILITIES[building.type].capacity === null ? null : facilityCapacity(building.type, building.tier);
  return capacity === null ? JOBS.uncappedFacility : Math.round(capacity / JOBS.facilityCapacityDivisor);
}
