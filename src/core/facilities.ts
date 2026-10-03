import type { Footprint } from './buildingSpecs';

export type ServiceCategory = 'education' | 'administration' | 'culture' | 'health' | 'safety';

export type FacilityType =
  | 'school'
  | 'middleSchool'
  | 'highSchool'
  | 'university'
  | 'townHall'
  | 'communityHall'
  | 'theater'
  | 'concertHall'
  | 'hospital'
  | 'fireStation'
  | 'policeStation';

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

const power = 2;

export const FACILITIES: Record<FacilityType, FacilitySpec> = {
  school: { category: 'education', unlockCitizens: 15, cost: 300, radius: 8, capacity: 200, footprint: { width: 2, depth: 2 }, power, water: 0 },
  communityHall: { category: 'culture', unlockCitizens: 32, cost: 150, radius: 6, capacity: 150, footprint: { width: 1, depth: 1 }, power, water: 0 },
  middleSchool: { category: 'education', unlockCitizens: 60, cost: 600, radius: 10, capacity: 400, footprint: { width: 2, depth: 2 }, power, water: 0 },
  highSchool: { category: 'education', unlockCitizens: 100, cost: 1000, radius: 12, capacity: 600, footprint: { width: 3, depth: 2 }, power, water: 0 },
  hospital: { category: 'health', unlockCitizens: 100, cost: 1500, radius: 14, capacity: 800, footprint: { width: 3, depth: 3 }, power, water: 2 },
  townHall: { category: 'administration', unlockCitizens: 160, cost: 2000, radius: null, capacity: null, footprint: { width: 3, depth: 2 }, power, water: 0, unique: true },
  fireStation: { category: 'safety', unlockCitizens: 160, cost: 1000, radius: 12, capacity: 800, footprint: { width: 2, depth: 2 }, power, water: 0 },
  policeStation: { category: 'safety', unlockCitizens: 160, cost: 1000, radius: 12, capacity: 800, footprint: { width: 2, depth: 2 }, power, water: 0 },
  theater: { category: 'culture', unlockCitizens: 250, cost: 800, radius: 10, capacity: 500, footprint: { width: 2, depth: 2 }, power, water: 0 },
  university: { category: 'education', unlockCitizens: 400, cost: 3000, radius: null, capacity: 2000, footprint: { width: 3, depth: 3 }, power, water: 0 },
  concertHall: { category: 'culture', unlockCitizens: 600, cost: 2000, radius: 14, capacity: 1200, footprint: { width: 3, depth: 3 }, power, water: 0 },
};

export const FACILITY_TYPES = Object.keys(FACILITIES) as FacilityType[];

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = ['education', 'administration', 'culture', 'health', 'safety'];

export function isFacilityType(type: string): type is FacilityType {
  return Object.hasOwn(FACILITIES, type);
}

export function facilitiesOfCategory(category: ServiceCategory): FacilityType[] {
  return FACILITY_TYPES.filter(type => FACILITIES[type].category === category);
}

export type ServiceKey = FacilityType;

export const REQUIRED_SERVICES: Readonly<Record<number, readonly FacilityType[]>> = {
  3: ['school'],
  5: ['highSchool', 'hospital'],
  6: ['townHall', 'fireStation', 'policeStation'],
};

export function requiredServices(tier: number): FacilityType[] {
  return Object.entries(REQUIRED_SERVICES).flatMap(([from, keys]) => (tier >= Number(from) ? keys : []));
}

export const SERVICES = { wellbeingBonus: 10, missingPenalty: 10, penaltyCap: 40, taxWellbeingDivisor: 500 };
