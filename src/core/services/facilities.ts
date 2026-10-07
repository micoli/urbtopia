import { definitionOf } from '../buildings/buildingDefinitions';
import type { Footprint } from '../buildings/buildingSpecs';

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

type FacilityRule = Omit<FacilitySpec, 'unlockCitizens' | 'cost' | 'footprint'>;

const RULES: Record<FacilityType, FacilityRule> = {
  communityHall: { category: 'culture', radius: 6, capacity: 150, power, water: 0 },
  school: { category: 'education', radius: 10, capacity: 300, power, water: 0 },
  middleSchool: { category: 'education', radius: 12, capacity: 400, power, water: 0 },
  highSchool: { category: 'education', radius: 14, capacity: 600, power, water: 0 },
  university: { category: 'education', radius: null, capacity: 2000, power, water: 0 },
  hospital: { category: 'health', radius: 14, capacity: 800, power, water: 2 },
  townHall: { category: 'administration', radius: null, capacity: null, power, water: 0, unique: true },
  fireStation: { category: 'safety', radius: 18, capacity: 800, power, water: 0 },
  policeStation: { category: 'safety', radius: 18, capacity: 800, power, water: 0 },
  theater: { category: 'culture', radius: 10, capacity: 500, power, water: 0 },
  concertHall: { category: 'culture', radius: 14, capacity: 1200, power, water: 0 },
};

export const FACILITIES = Object.fromEntries(Object.entries(RULES).map(([type, rule]) => {
  const { footprint, cost, unlockCitizens } = definitionOf(type as FacilityType);
  const [width, depth] = footprint!;
  return [type, { ...rule, cost: cost!, unlockCitizens: unlockCitizens!, footprint: { width, depth } }];
})) as Record<FacilityType, FacilitySpec>;

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

export const FACILITY_TIER_CAPACITY: readonly number[] = [1, 1.5, 2, 3, 4, 5.5, 7, 9];

export const MAX_FACILITY_TIER = FACILITY_TIER_CAPACITY.length;

const FACILITY_UPGRADE_COST_FACTORS: readonly number[] = [0.6, 1.2, 2.4, 4, 6, 9, 13];

export function facilityCapacity(type: FacilityType, tier: number): number | null {
  const base = FACILITIES[type].capacity;
  if (base === null) return null;
  return base * (FACILITY_TIER_CAPACITY[tier - 1] ?? 1);
}

export function facilityUpgradeCosts(type: FacilityType): Record<number, { urbs: number; goods: Record<string, never> }> {
  if (FACILITIES[type].capacity === null) return {};
  return Object.fromEntries(
    FACILITY_UPGRADE_COST_FACTORS.map((factor, index) => [index + 2, { urbs: Math.round((FACILITIES[type].cost * factor) / 10) * 10, goods: {} }]),
  );
}
