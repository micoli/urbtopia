import { BUILDING_ENTRIES, tiersOf } from '../buildings/buildingDefinitions';
import type { Footprint } from '../buildings/buildingSpecs';
import type { FacilityType } from '../buildings/buildingTypes.generated';
import { SERVICE_CATEGORIES, type ServiceCategory } from './serviceCategories';

export { SERVICE_CATEGORIES, type FacilityType, type ServiceCategory };

export interface FacilitySpec {
  category: ServiceCategory;
  unlockCitizens: number;
  cost: number;
  radius: number | null;
  capacity: number | null;
  footprint: Footprint;
  power: number;
  water: number;
  unique?: boolean;
}

// Tier 1 of each Public facility; a facility without a radius covers the whole city, one without capacity serves everyone.
export const FACILITIES = Object.fromEntries(
  BUILDING_ENTRIES.filter(({ kind }) => kind === 'facility').map(({ id, category, unlockCitizens, cost, radius, footprint, power, water, unique }): [string, FacilitySpec] => {
    const [width, depth] = footprint!;
    const capacity = tiersOf(id)[0]?.capacity ?? null;
    return [id, { category: category!, unlockCitizens: unlockCitizens!, cost: cost!, radius: radius ?? null, capacity, footprint: { width, depth }, power: power!, water: water!, ...(unique ? { unique } : {}) }];
  }),
) as Record<FacilityType, FacilitySpec>;

export const FACILITY_TYPES = Object.keys(FACILITIES) as FacilityType[];

export function isFacilityType(type: string): type is FacilityType {
  return Object.hasOwn(FACILITIES, type);
}

export function facilitiesOfCategory(category: ServiceCategory): FacilityType[] {
  return FACILITY_TYPES.filter(type => FACILITIES[type].category === category);
}

export type ServiceKey = FacilityType;

export const REQUIRED_SERVICES: Readonly<Record<number, readonly FacilityType[]>> = {
  3: ['school'],
  5: ['hospital'],
  6: ['townHall', 'fireStation', 'policeStation'],
};

export function requiredServices(tier: number): FacilityType[] {
  return Object.entries(REQUIRED_SERVICES).flatMap(([from, keys]) => (tier >= Number(from) ? keys : []));
}

export const SERVICES = { wellbeingBonus: 10, missingPenalty: 10, penaltyCap: 40, taxWellbeingDivisor: 500 };

export const REACH_CORNER_RADIUS = 3;

export function isWithinReach(dx: number, dy: number, radius: number): boolean {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  if (x > radius || y > radius) return false;
  const inset = radius - REACH_CORNER_RADIUS;
  if (x <= inset || y <= inset) return true;
  return (x - inset) ** 2 + (y - inset) ** 2 <= REACH_CORNER_RADIUS ** 2;
}

export function facilityCapacity(type: FacilityType, tier: number): number | null {
  const tiers = tiersOf(type);
  return (tiers[tier - 1] ?? tiers[0])?.capacity ?? null;
}
