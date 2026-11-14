import type { Building, BuildingType } from '../engine/state';
import { totalStaff } from '../venues/staff';
import { totalInteriorStaff } from '../interiors/interiorStaff';
import { VENUE_TYPES, isVenueType } from '../venues/profiles';
import { INDUSTRY_TYPES, industryWeightOf } from '../economy/productionTypes';
import { SHOP_TYPES, isShopType, shopTierOf } from '../economy/shops';
import { OFFICE_TYPES, isOfficeType, officeTierOf } from '../economy/offices';
import { FACILITIES, FACILITY_TYPES, facilityCapacity, isFacilityType } from '../services/facilities';

export const workplaceTypes: readonly BuildingType[] = [...INDUSTRY_TYPES, ...SHOP_TYPES, ...OFFICE_TYPES, 'casino', 'farm', 'packhouse', ...VENUE_TYPES, ...FACILITY_TYPES];

export const JOBS = {
  farmPerTier: 10,
  packhousePerTier: 5,
  workshopPerTier: 25,
  factoryPerTier: 25,
  casinoPerTier: 15,
  facilityCapacityDivisor: 40,
  uncappedFacility: 40,
};

// The Jobs a building offers by itself, before the Staff hired in its interior.
function baseJobsOf(building: Building): number {
  if (building.type === 'casino') return JOBS.casinoPerTier * building.tier;
  if (building.type === 'farm') return JOBS.farmPerTier * building.tier;
  if (building.type === 'packhouse') return JOBS.packhousePerTier * building.tier;
  const weight = industryWeightOf(building.type);
  if (weight > 0) return (weight === 1 ? JOBS.workshopPerTier : JOBS.factoryPerTier) * building.tier;
  if (isShopType(building.type)) return shopTierOf(building).jobs;
  if (isOfficeType(building.type)) return officeTierOf(building).jobs;
  if (isVenueType(building.type)) return building.venue ? totalStaff(building.venue) : 0;
  if (!isFacilityType(building.type)) return 0;
  const capacity = FACILITIES[building.type].capacity === null ? null : facilityCapacity(building.type, building.tier);
  return capacity === null ? JOBS.uncappedFacility : Math.round(capacity / JOBS.facilityCapacityDivisor);
}

// The Staff hired in an interior are Jobs of the building, filled by Citizens like the others.
export const jobsOf = (building: Building): number => baseJobsOf(building) + totalInteriorStaff(building);
