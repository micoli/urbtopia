import { createBuilding } from './buildingSpecs';
import { citizensOf } from './city';
import { centerOf, distance } from './ecology';
import { FACILITIES, FACILITY_TYPES, facilityCapacity, SERVICE_CATEGORIES, facilitiesOfCategory, isWithinReach, requiredServices, type FacilityType, type ServiceCategory, type ServiceKey } from './facilities';
import type { Building, GameState, Rotation } from './state';

export type ServiceCoverage = ReadonlyMap<number, ReadonlySet<FacilityType>>;

const coverageCache = new WeakMap<readonly Building[], ServiceCoverage>();

const byDistanceThenId = (distances: ReadonlyMap<number, number>) => (a: Building, b: Building) =>
  (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0) || a.id - b.id;

function serve(covered: Set<number>, homes: Building[], capacity: number, distances: ReadonlyMap<number, number>): void {
  let remaining = capacity;
  for (const home of homes.filter(candidate => !covered.has(candidate.id)).sort(byDistanceThenId(distances))) {
    if (remaining <= 0) return;
    covered.add(home.id);
    remaining -= citizensOf(home.tier);
  }
}

export function isHomeInReach(facility: Building, home: Building, radius: number): boolean {
  const from = centerOf(facility);
  const to = centerOf(home);
  return isWithinReach(to.x - from.x, to.y - from.y, radius);
}

function capacityOf(facility: Building): number {
  return facilityCapacity(facility.type as FacilityType, facility.tier) ?? Infinity;
}

function coveredHomes(type: FacilityType, facilities: Building[], homes: Building[]): Set<number> {
  const { radius } = FACILITIES[type];
  const covered = new Set<number>();
  if (radius === null) {
    const nearest = new Map(homes.map(home => [home.id, Math.min(...facilities.map(facility => distance(facility, home)))]));
    serve(covered, homes, facilities.reduce((total, facility) => total + capacityOf(facility), 0), nearest);
    return covered;
  }
  for (const facility of facilities) {
    const reachable = homes.filter(home => isHomeInReach(facility, home, radius));
    serve(covered, reachable, capacityOf(facility), new Map(reachable.map(home => [home.id, distance(facility, home)])));
  }
  return covered;
}

export function serviceCoverage(state: GameState): ServiceCoverage {
  const cached = coverageCache.get(state.buildings);
  if (cached) return cached;
  const homes = state.buildings.filter(building => building.type === 'home').sort((a, b) => a.id - b.id);
  const result = new Map<number, Set<FacilityType>>(homes.map(home => [home.id, new Set()]));
  for (const type of FACILITY_TYPES) {
    const facilities = state.buildings.filter(building => building.type === type).sort((a, b) => a.id - b.id);
    if (!facilities.length) continue;
    for (const id of coveredHomes(type, facilities, homes)) result.get(id)?.add(type);
  }
  coverageCache.set(state.buildings, result);
  return result;
}

export type UncoveredReason = 'none' | 'outOfReach' | 'capacityFull';

export function uncoveredReason(state: GameState, home: Building, type: FacilityType): UncoveredReason {
  const facilities = state.buildings.filter(building => building.type === type);
  if (!facilities.length) return 'none';
  const { radius } = FACILITIES[type];
  if (radius !== null && !facilities.some(facility => isHomeInReach(facility, home, radius))) return 'outOfReach';
  return 'capacityFull';
}

export function isServiceCovered(coverage: ServiceCoverage, homeId: number, key: ServiceKey): boolean {
  const covered = coverage.get(homeId);
  if (!covered) return false;
  return covered.has(key);
}

export function missingServices(coverage: ServiceCoverage, home: Building, tier = home.tier): ServiceKey[] {
  return requiredServices(tier).filter(key => !isServiceCovered(coverage, home.id, key));
}

export function coveredCategories(coverage: ServiceCoverage, homeId: number): ServiceCategory[] {
  const covered = coverage.get(homeId);
  if (!covered) return [];
  return SERVICE_CATEGORIES.filter(category => facilitiesOfCategory(category).some(type => covered.has(type)));
}

export function coveredServiceUnits(coverage: ServiceCoverage, homeId: number): number {
  const covered = coverage.get(homeId);
  if (!covered) return 0;
  const cultureTypes = facilitiesOfCategory('culture').filter(type => covered.has(type)).length;
  const otherCategories = coveredCategories(coverage, homeId).filter(category => category !== 'culture').length;
  return otherCategories + cultureTypes;
}

export function categoryCoverageRatio(state: GameState, category: ServiceCategory): number {
  const coverage = serviceCoverage(state);
  let total = 0;
  let served = 0;
  for (const home of state.buildings) {
    if (home.type !== 'home') continue;
    const citizens = citizensOf(home.tier);
    total += citizens;
    if (coveredCategories(coverage, home.id).includes(category)) served += citizens;
  }
  return total > 0 ? served / total : 0;
}

export function homesLackingRequiredServices(state: GameState): Building[] {
  const coverage = serviceCoverage(state);
  return state.buildings.filter(building => building.type === 'home' && missingServices(coverage, building).length > 0);
}

export function previewFacilityCoverage(state: GameState, type: FacilityType, x: number, y: number, rotation: Rotation): Building[] {
  const before = serviceCoverage(state);
  const probe = createBuilding(state.nextId, type, x, y, rotation);
  const after = serviceCoverage({ ...state, buildings: [...state.buildings, probe] });
  return state.buildings.filter(building => building.type === 'home' && after.get(building.id)?.has(type) && !before.get(building.id)?.has(type));
}
