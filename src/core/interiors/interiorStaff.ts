import interiors from '../../../assets/defs/balance/interiors.json' with { type: 'json' };
import type { Building, BuildingType, InteriorData, InteriorRole } from '../engine/state';
import { STAFF } from '../venues/staff';

export type InteriorFamily = 'production' | 'service';

export type InteriorPart = 'speed' | 'salesRate' | 'cheeseYield' | 'creamYield' | 'capacity' | 'schooling' | 'knowledge' | 'carePrimary' | 'careDoctor' | 'careSurgeon';

export interface InteriorLayout {
  gridSizes: number[];
  speedCaps: number[];
  yieldCaps: number[];
  technicianPosts: number[];
  line?: true;
  salesCaps?: number[];
  capacityCaps?: number[];
  yieldGroups?: Record<string, string[]>;
}

export interface ServiceLayout {
  gridSizes: number[];
  qualityCaps: number[];
}

export interface CareBalance {
  points: number;
  weights: { carePrimary: number; careDoctor: number; careSurgeon: number };
}

interface InteriorDeclaration {
  care?: CareBalance;
  family: InteriorFamily;
  unlockCitizens?: number;
  service?: ServiceLayout;
  layout?: InteriorLayout;
  roles: Partial<Record<InteriorRole, { part: InteriorPart; posts: number[] }>>;
}

const DECLARATIONS = interiors.buildings as Record<string, InteriorDeclaration>;

export const interiorDeclarationOf = (type: BuildingType): InteriorDeclaration | undefined => DECLARATIONS[type];

// The group of Goods that an item belongs to in a building that splits its yield, if it does.
export const yieldGroupOf = (type: BuildingType, item: string): string | undefined => Object.entries(DECLARATIONS[type]?.layout?.yieldGroups ?? {}).find(([, items]) => items.includes(item))?.[0];

export const interiorLayoutOf = (type: BuildingType): InteriorLayout | undefined => DECLARATIONS[type]?.layout;

export const interiorUnlockCitizensOf = (type: BuildingType): number => DECLARATIONS[type]?.unlockCitizens ?? 0;

export const careBalanceOf = (type: BuildingType): CareBalance | undefined => DECLARATIONS[type]?.care;

export const serviceLayoutOf = (type: BuildingType): ServiceLayout | undefined => DECLARATIONS[type]?.service;

export const interiorFamilyOf = (type: BuildingType): InteriorFamily | undefined => DECLARATIONS[type]?.family;

export const interiorRolesOf = (type: BuildingType): readonly InteriorRole[] => Object.keys(DECLARATIONS[type]?.roles ?? {}) as InteriorRole[];

export const partOfRole = (type: BuildingType, role: InteriorRole): InteriorPart | undefined => DECLARATIONS[type]?.roles[role]?.part;

const postsByTier = (type: BuildingType, role: InteriorRole): readonly number[] => DECLARATIONS[type]?.roles[role]?.posts ?? [];

export const interiorPostsOf = (type: BuildingType, role: InteriorRole, tier: number): number => {
  const posts = postsByTier(type, role);
  return posts.length === 0 ? 0 : posts[Math.min(tier, posts.length) - 1]!;
};

export const minTierOfInteriorRole = (type: BuildingType, role: InteriorRole): number => postsByTier(type, role).findIndex(posts => posts > 0) + 1;

export const hiredInteriorOf = (interior: InteriorData | undefined, role: InteriorRole): number => interior?.staff?.[role] ?? 0;

export const totalInteriorStaff = (building: Pick<Building, 'type' | 'interior'>): number =>
  interiorRolesOf(building.type).reduce((total, role) => total + hiredInteriorOf(building.interior, role), 0);

export const interiorWagesPerHour = (building: Pick<Building, 'type' | 'interior'>): number =>
  interiorRolesOf(building.type).reduce((total, role) => total + hiredInteriorOf(building.interior, role) * STAFF.dailyWage[role], 0) / STAFF.dayHours;

// How much of the part a role carries is delivered, from 0 to 1: the hired Staff that come to work over the posts of the Tier. A role with no post at the Tier delivers nothing.
export function interiorRoleShare(building: Pick<Building, 'type' | 'tier' | 'interior'>, role: InteriorRole, fillRate: number): number {
  const posts = interiorPostsOf(building.type, role, building.tier);
  if (posts === 0) return 0;
  return Math.min(1, (hiredInteriorOf(building.interior, role) * fillRate) / posts);
}

// The share of a part that the Staff hired would deliver if every one of them came to work, or 1 for a part no role of the building carries (the Factory has no roles).
export function interiorPartPresence(building: Pick<Building, 'type' | 'tier' | 'interior'>, part: InteriorPart): number {
  const roles = (Object.entries(DECLARATIONS[building.type]?.roles ?? {}) as [InteriorRole, { part: InteriorPart }][]).filter(([, role]) => role.part === part);
  if (roles.length === 0) return 1;
  return Math.min(1, roles.reduce((total, [role]) => total + interiorRoleShare(building, role, 1), 0));
}

// The Staff that come to work over the Staff hired, from the Jobs that Citizens fill: a building with no interior Staff is complete.
export function interiorFillRateFrom(building: Building, filledJobs: ReadonlyMap<number, number> | undefined, jobs: number): number {
  if (totalInteriorStaff(building) === 0 || filledJobs === undefined || jobs === 0) return 1;
  return Math.min(1, (filledJobs.get(building.id) ?? 0) / jobs);
}
