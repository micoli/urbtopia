import { buildingsOfType } from '../buildings/buildingIndex';
import type { GameState } from '../engine/state';
import { valueByTier } from '../interiors/valueByTier';
import partsFile from '../../../assets/defs/architect/parts.json' with { type: 'json' };
import { BRICKS, BRICK_DEFINITIONS, DECORS, DECOR_DEFINITIONS, GRID, MAX_FLOORS, ROOFS, ROOF_DEFINITIONS, activeChimneys, activeDecors, activeDormers, exteriorEdges, getBrick, roofRects, roofStyle, type Brick, type Decor, type Plan, type Roof } from './housePlan';

export const ARCHITECT_TIER_COUNT = 5;

// What each Tier of the Architect office unlocks in the studio, from Tier 1 to Tier 5, as the definitions of assets/defs/architect give it. A later Tier keeps everything an earlier one had.
const byTierOf = <T extends string>(ids: readonly T[], tierOf: (id: T) => number): readonly (readonly T[])[] =>
  Array.from({ length: ARCHITECT_TIER_COUNT }, (_, index) => ids.filter((id) => tierOf(id) === index + 1));

export const ARCHITECT_BRICKS_BY_TIER: readonly (readonly Brick[])[] = byTierOf(BRICKS, (brick) => BRICK_DEFINITIONS[brick].tier);

export const ARCHITECT_DECORS_BY_TIER: readonly (readonly Decor[])[] = byTierOf(DECORS, (decor) => DECOR_DEFINITIONS[decor].tier);

export const ARCHITECT_ROOFS_BY_TIER: readonly (readonly Roof[])[] = byTierOf(ROOFS, (roof) => ROOF_DEFINITIONS[roof].tier);

export const ARCHITECT_FLOORS = [2, 3, 3, 4, 4];
export const ARCHITECT_GRID_SIDE = [5, 5, 6, 6, 6];
export const ARCHITECT_DORMER_TIER = partsFile.dormerTier;
export const ARCHITECT_CHIMNEY_TIER = partsFile.chimneyTier;
export const ARCHITECT_PLAN_LIMITS = [3, 6, 9, 12, 15];

export interface ArchitectColor {
  readonly id: string;
  readonly color: string;
}

export const ARCHITECT_WALL_COLORS: readonly ArchitectColor[] = [
  { id: 'sand', color: '#e8d9b5' },
  { id: 'offwhite', color: '#f1f1f6' },
  { id: 'cream', color: '#fff1d6' },
  { id: 'plaster', color: '#efe4cc' },
  { id: 'limestone', color: '#bdb7a6' },
  { id: 'stone', color: '#d9d0bd' },
  { id: 'yellowbrick', color: '#d8b45c' },
  { id: 'ochre', color: '#d9b878' },
  { id: 'salmon', color: '#ff9c80' },
  { id: 'dustypink', color: '#d9a89a' },
  { id: 'bluegrey', color: '#8ea3bd' },
  { id: 'grey', color: '#a4a9ad' },
  { id: 'greygreen', color: '#6f8f7c' },
  { id: 'brownstone', color: '#8f5a43' },
];

export const ARCHITECT_ROOF_COLORS: readonly ArchitectColor[] = [
  { id: 'terracotta', color: '#b5533c' },
  { id: 'brick', color: '#c2432e' },
  { id: 'tile', color: '#a85a3c' },
  { id: 'clay', color: '#b5573a' },
  { id: 'thatch', color: '#b99a58' },
  { id: 'mint', color: '#96ddbc' },
  { id: 'greygreen', color: '#6f8f7c' },
  { id: 'lightgrey', color: '#b4b8c8' },
  { id: 'slate', color: '#6d7390' },
  { id: 'slateblue', color: '#46566e' },
  { id: 'anthracite', color: '#54585f' },
  { id: 'shingle', color: '#5a4636' },
];

// Colour swatches of the studio, by Tier: how many of the first colours of each list are unlocked.
export const ARCHITECT_WALL_SWATCHES = [8, 10, 12, 14, 14];
export const ARCHITECT_ROOF_SWATCHES = [6, 8, 10, 12, 12];

// Without an office the city is at Tier 1.
const byTier = (values: readonly number[], tier: number): number => valueByTier(values, Math.max(1, tier));

const unlockedUpTo = <T>(byTier: readonly (readonly T[])[], tier: number): readonly T[] => byTier.slice(0, Math.max(1, tier)).flat();

export const unlockedBricks = (tier: number): readonly Brick[] => unlockedUpTo(ARCHITECT_BRICKS_BY_TIER, tier);

export const unlockedDecors = (tier: number): readonly Decor[] => unlockedUpTo(ARCHITECT_DECORS_BY_TIER, tier);

export const unlockedRoofs = (tier: number): readonly Roof[] => unlockedUpTo(ARCHITECT_ROOFS_BY_TIER, tier);

export const tierOfBrick = (brick: Brick): number => ARCHITECT_BRICKS_BY_TIER.findIndex((bricks) => bricks.includes(brick)) + 1;

export const tierOfDecor = (decor: Decor): number => ARCHITECT_DECORS_BY_TIER.findIndex((decors) => decors.includes(decor)) + 1;

export const tierOfRoof = (roof: Roof): number => ARCHITECT_ROOFS_BY_TIER.findIndex((roofs) => roofs.includes(roof)) + 1;

export const maxFloorsOf = (tier: number): number => Math.min(MAX_FLOORS, byTier(ARCHITECT_FLOORS, tier));

export const gridSideOf = (tier: number): number => Math.min(GRID, byTier(ARCHITECT_GRID_SIDE, tier));

export const planLimitOf = (tier: number): number => byTier(ARCHITECT_PLAN_LIMITS, tier);

export const wallSwatchCountOf = (tier: number): number => byTier(ARCHITECT_WALL_SWATCHES, tier);

export const roofSwatchCountOf = (tier: number): number => byTier(ARCHITECT_ROOF_SWATCHES, tier);

// The Tier of the Architect office of the city, 0 without one.
export const architectTierOf = (state: Pick<GameState, 'buildings'>): number =>
  Math.max(0, ...buildingsOfType(state.buildings, 'architectOffice').map((office) => office.tier));

function planExtent(plan: Plan): { width: number; depth: number } {
  let width = 0;
  let depth = 0;
  let c0 = GRID, r0 = GRID;
  plan.floors.forEach((floor) => floor.forEach((row, r) => row.forEach((on, c) => {
    if (!on) return;
    c0 = Math.min(c0, c);
    r0 = Math.min(r0, r);
  })));
  plan.floors.forEach((floor) => floor.forEach((row, r) => row.forEach((on, c) => {
    if (!on) return;
    width = Math.max(width, c - c0 + 1);
    depth = Math.max(depth, r - r0 + 1);
  })));
  return { width, depth };
}

// The first Tier that unlocks a colour; a colour outside the lists needs the last Tier.
function tierOfColor(colors: readonly ArchitectColor[], counts: readonly number[], color: string): number {
  const index = colors.findIndex((candidate) => candidate.color.toLowerCase() === color.toLowerCase());
  if (index < 0) return ARCHITECT_TIER_COUNT;
  return firstTierWhere((tier) => byTier(counts, tier) > index);
}

// The Tier a plan needs: the lowest Tier that unlocks everything it uses.
export function tierRequiredBy(plan: Plan): number {
  const tiers = [1];
  const { width, depth } = planExtent(plan);
  const side = Math.max(width, depth);
  tiers.push(firstTierWhere((tier) => gridSideOf(tier) >= side));
  tiers.push(firstTierWhere((tier) => maxFloorsOf(tier) >= plan.floors.length));
  tiers.push(tierOfColor(ARCHITECT_WALL_COLORS, ARCHITECT_WALL_SWATCHES, plan.wallColor), tierOfColor(ARCHITECT_ROOF_COLORS, ARCHITECT_ROOF_SWATCHES, plan.roofColor));
  exteriorEdges(plan).forEach((edge) => tiers.push(tierOfBrick(getBrick(plan, edge))));
  roofRects(plan).forEach((rect) => tiers.push(tierOfRoof(roofStyle(plan, rect).type)));
  activeDecors(plan).forEach(({ decor }) => tiers.push(tierOfDecor(decor)));
  if (activeDormers(plan).length > 0) tiers.push(ARCHITECT_DORMER_TIER);
  if (activeChimneys(plan).length > 0) tiers.push(ARCHITECT_CHIMNEY_TIER);
  return Math.max(...tiers.filter((tier) => tier > 0));
}

function firstTierWhere(fits: (tier: number) => boolean): number {
  for (let tier = 1; tier <= ARCHITECT_TIER_COUNT; tier++) if (fits(tier)) return tier;
  return ARCHITECT_TIER_COUNT;
}

export const isPlanUnlockedAt = (plan: Plan, tier: number): boolean => tierRequiredBy(plan) <= Math.max(1, tier);
