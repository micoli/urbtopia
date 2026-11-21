import { GRID, planFrom, stats, type Plan } from './housePlan';

// A plan built on the map as a Home. The plan is copied into the building so it stays when the plan is deleted;
// while `planId` points to a saved plan of the city, saving that plan again updates the copy.
export interface HouseDesign {
  readonly name: string;
  readonly plan: Plan;
  readonly planId?: number;
}

export const HOUSE_PLAN_TYPE_PREFIX = 'housePlan-';

export const isHousePlanType = (type: string): boolean => type.startsWith(HOUSE_PLAN_TYPE_PREFIX);

export const housePlanTypeOfSize = (width: number, depth: number): string => `${HOUSE_PLAN_TYPE_PREFIX}${width}x${depth}`;

// A cell of a plan is a quarter of a tile of the map on each side.
export const CELLS_PER_TILE = 4;

export const MAX_HOUSE_PLAN_TILES = Math.ceil(GRID / CELLS_PER_TILE);

// The rectangle of tiles a plan covers: the cells of its ground floor, the others stand on them.
export function housePlanSize(plan: Plan): { width: number; depth: number } {
  let c0 = GRID, r0 = GRID, c1 = -1, r1 = -1;
  plan.floors[0]?.forEach((row, r) => row.forEach((on, c) => {
    if (!on) return;
    c0 = Math.min(c0, c);
    c1 = Math.max(c1, c);
    r0 = Math.min(r0, r);
    r1 = Math.max(r1, r);
  }));
  return { width: Math.ceil((c1 - c0 + 1) / CELLS_PER_TILE), depth: Math.ceil((r1 - r0 + 1) / CELLS_PER_TILE) };
}

export const housePlanTypeOf = (plan: Plan): string => {
  const { width, depth } = housePlanSize(plan);
  return housePlanTypeOfSize(width, depth);
};

export const designCostOf = (design: HouseDesign): number => stats(design.plan).cost;

const sizeOfType = (type: string): { width: number; depth: number } | null => {
  const match = /^housePlan-(\d+)x(\d+)$/.exec(type);
  return match ? { width: Number(match[1]), depth: Number(match[2]) } : null;
};

// A plan fits a house type when its footprint is no larger than the type's, in width and in depth.
export const planFitsType = (type: string, plan: Plan): boolean => {
  const size = sizeOfType(type);
  if (!size) return false;
  const { width, depth } = housePlanSize(plan);
  return width <= size.width && depth <= size.depth;
};

// A design is a valid plan whose size is the footprint of the type it is built as.
export const isDesignOfType = (type: string, design: HouseDesign): boolean =>
  isHousePlanType(type) && (design.planId === undefined || (Number.isInteger(design.planId) && design.planId >= 1)) && typeof design.name === 'string' && design.name.trim() !== '' && !('error' in planFrom(design.plan)) && housePlanTypeOf(design.plan) === type;

// The design of a house already built: a plan that was edited to a smaller footprint still stands on the tiles of its house.
export const isDesignWithinType = (type: string, design: HouseDesign): boolean =>
  isHousePlanType(type) && (design.planId === undefined || (Number.isInteger(design.planId) && design.planId >= 1)) && typeof design.name === 'string' && design.name.trim() !== '' && !('error' in planFrom(design.plan)) && planFitsType(type, design.plan);
