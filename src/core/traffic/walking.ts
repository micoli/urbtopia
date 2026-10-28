import { isShopType } from '../economy/shops';
import type { Building, BuildingType } from '../engine/state';
import type { CongestionStats } from './congestion';

export type WalkDestination = 'shop' | 'school' | 'health' | 'culture' | 'casino' | 'park' | 'townHall';

export const WALK_DESTINATIONS: readonly WalkDestination[] = ['shop', 'school', 'health', 'culture', 'casino', 'park', 'townHall'];

export const WALKING = {
  enabled: true,
  workThreshold: 10,
  thresholds: { shop: 12, school: 15, health: 15, culture: 15, casino: 15, park: 20, townHall: 15 } as Record<WalkDestination, number>,
  tripsPerCitizen: { shop: 1, school: 0.6, health: 0.2, culture: 0.3, casino: 0.2, park: 0.5, townHall: 0.2 } as Record<WalkDestination, number>,
  wellbeingBonus: 8,
  crossingCutPerPedestrian: 0.015,
  maxCrossingCut: 0.6,
  cyclingFactor: 3,
};

export function crossingCut(pedestrians: number): number {
  return Math.min(WALKING.maxCrossingCut, WALKING.crossingCutPerPedestrian * pedestrians);
}

export interface ModeShares {
  car: number;
  transit: number;
  walking: number;
  cycling: number;
}

export function modeShares(stats: CongestionStats): ModeShares {
  const total = stats.modes.car + stats.modes.transit + stats.modes.walking + stats.modes.cycling;
  if (total <= 0) return { car: 0, transit: 0, walking: 0, cycling: 0 };
  return { car: stats.modes.car / total, transit: stats.modes.transit / total, walking: stats.modes.walking / total, cycling: stats.modes.cycling / total };
}

export function maxWalkCost(): number {
  return WALKING.cyclingFactor * Math.max(WALKING.workThreshold, ...Object.values(WALKING.thresholds));
}

const CULTURE: readonly BuildingType[] = ['theater', 'concertHall', 'communityHall'];
const SCHOOLS: readonly BuildingType[] = ['school', 'middleSchool', 'highSchool', 'university'];

export function walkDestinationOf(building: Building): WalkDestination | null {
  if (isShopType(building.type)) return 'shop';
  if (building.type === 'casino') return 'casino';
  if (building.type === 'hospital') return 'health';
  if (building.type === 'townHall') return 'townHall';
  if (SCHOOLS.includes(building.type)) return 'school';
  if (CULTURE.includes(building.type)) return 'culture';
  if (isPark(building.type)) return 'park';
  return null;
}

// Trees, shrubs, flowers, hives and other decoration are scenery, not somewhere to walk to.
function isPark(type: BuildingType): boolean {
  return type === 'park';
}

export function walkAccessOf(trips: ReadonlyMap<WalkDestination, number>, citizens: number): number {
  if (citizens <= 0) return 0;
  const reached = WALK_DESTINATIONS.filter((kind) => (trips.get(kind) ?? 0) > 0);
  const total = WALK_DESTINATIONS.reduce((sum, kind) => sum + WALKING.tripsPerCitizen[kind], 0);
  return reached.reduce((sum, kind) => sum + WALKING.tripsPerCitizen[kind], 0) / total;
}
