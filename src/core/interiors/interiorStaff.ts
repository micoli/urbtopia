import interiors from '../../../assets/defs/balance/interiors.json' with { type: 'json' };
import type { Building, BuildingType, InteriorData, InteriorRole } from '../engine/state';
import { STAFF } from '../venues/staff';

export type InteriorFamily = 'production' | 'service';

export type InteriorPart = 'speed' | 'salesRate' | 'cheeseYield' | 'creamYield' | 'capacity' | 'schooling' | 'knowledge' | 'carePrimary' | 'careDoctor' | 'careSurgeon';

interface InteriorDeclaration {
  family: InteriorFamily;
  roles: Partial<Record<InteriorRole, { part: InteriorPart; posts: number[] }>>;
}

const DECLARATIONS = interiors.buildings as Record<string, InteriorDeclaration>;

export const interiorDeclarationOf = (type: BuildingType): InteriorDeclaration | undefined => DECLARATIONS[type];

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
