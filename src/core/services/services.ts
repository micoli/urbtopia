import { createBuilding } from '../buildings/buildingSpecs';
import { citizensOf } from '../buildings/city';
import { centerOf, distance } from '../environment/ecology';
import { FACILITIES, FACILITY_TYPES, facilityCapacity, SERVICE_CATEGORIES, facilitiesOfCategory, isWithinReach, requiredServices, type FacilityType, type ServiceCategory, type ServiceKey } from './facilities';
import type { Building, GameState, Rotation } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { isWasteCovered, isWasteMissing, wasteCauseOf, wasteReport, type WasteCause } from '../waste/waste';
import { WASTE_REQUIRED_TIER } from '../waste/wasteBalance';
import { transitReachOf, type TransitLink, type TransitReach } from '../transit/transitReach';

export type ServiceCoverage = ReadonlyMap<number, ReadonlySet<FacilityType>>;

export type TransitReachLinks = ReadonlyMap<number, ReadonlyMap<FacilityType, TransitLink & { facilityId: number }>>;

interface Coverage {
  coverage: ServiceCoverage;
  viaTransit: TransitReachLinks;
}

// Fast public transport joins Homes to facilities, so the lines, their vehicles and the networks they run on count in the key besides the buildings.
const coverageCache = new WeakMap<readonly Building[], { key: readonly unknown[]; result: Coverage }>();

const transitKey = (state: GameState): readonly unknown[] => [state.transitLines, state.transitFleet, state.brtRoads, state.rails, state.roads, state.roundabouts];

const sameKey = (a: readonly unknown[], b: readonly unknown[]) => a.every((part, index) => part === b[index]);

const byDistanceThenId = (distances: ReadonlyMap<number, number>) => (a: Building, b: Building) =>
  (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0) || a.id - b.id;

function serve(covered: Set<number>, homes: Building[], capacity: number, distances: ReadonlyMap<number, number>, served: (home: Building) => void = () => {}): number {
  let remaining = capacity;
  for (const home of homes.filter(candidate => !covered.has(candidate.id)).sort(byDistanceThenId(distances))) {
    if (remaining <= 0) return remaining;
    covered.add(home.id);
    served(home);
    remaining -= citizensOf(home.tier);
  }
  return remaining;
}

export function isHomeInReach(facility: Building, home: Building, radius: number): boolean {
  const from = centerOf(facility);
  const to = centerOf(home);
  return isWithinReach(to.x - from.x, to.y - from.y, radius);
}

function capacityOf(facility: Building): number {
  return facilityCapacity(facility.type as FacilityType, facility.tier) ?? Infinity;
}

interface TypeCoverage {
  covered: Set<number>;
  links: Map<number, TransitLink & { facilityId: number }>;
}

function coveredHomes(type: FacilityType, facilities: Building[], homes: Building[], transit: TransitReach | null): TypeCoverage {
  const { radius } = FACILITIES[type];
  const covered = new Set<number>();
  const links = new Map<number, TransitLink & { facilityId: number }>();
  if (radius === null) {
    const nearest = new Map(homes.map(home => [home.id, Math.min(...facilities.map(facility => distance(facility, home)))]));
    serve(covered, homes, facilities.reduce((total, facility) => total + capacityOf(facility), 0), nearest);
    return { covered, links };
  }
  const remaining = new Map<Building, number>();
  for (const facility of facilities) {
    const reachable = homes.filter(home => isHomeInReach(facility, home, radius));
    remaining.set(facility, serve(covered, reachable, capacityOf(facility), new Map(reachable.map(home => [home.id, distance(facility, home)]))));
  }
  if (!transit) return { covered, links };
  for (const facility of facilities) {
    const beyond = homes.filter(home => !covered.has(home.id) && !isHomeInReach(facility, home, radius));
    const reached = transit.linksOf(facility, beyond);
    const candidates = beyond.filter(home => reached.has(home.id));
    serve(covered, candidates, remaining.get(facility) ?? 0, new Map(candidates.map(home => [home.id, reached.get(home.id)!.minutes])), home => links.set(home.id, { ...reached.get(home.id)!, facilityId: facility.id }));
  }
  return { covered, links };
}

function computeCoverage(state: GameState): Coverage {
  const homes = state.buildings.filter(building => isHomeType(building.type)).sort((a, b) => a.id - b.id);
  const result = new Map<number, Set<FacilityType>>(homes.map(home => [home.id, new Set()]));
  const viaTransit = new Map<number, Map<FacilityType, TransitLink & { facilityId: number }>>();
  const transit = transitReachOf(state);
  for (const type of FACILITY_TYPES) {
    if (FACILITIES[type].category === 'waste') continue;
    const facilities = state.buildings.filter(building => building.type === type).sort((a, b) => a.id - b.id);
    if (!facilities.length) continue;
    const { covered, links } = coveredHomes(type, facilities, homes, transit);
    for (const id of covered) result.get(id)?.add(type);
    for (const [id, link] of links) viaTransit.set(id, (viaTransit.get(id) ?? new Map()).set(type, link));
  }
  return { coverage: result, viaTransit };
}

function coverageOf(state: GameState): Coverage {
  const key = transitKey(state);
  const cached = coverageCache.get(state.buildings);
  if (cached && sameKey(cached.key, key)) return cached.result;
  const result = computeCoverage(state);
  coverageCache.set(state.buildings, { key, result });
  return result;
}

export const serviceCoverage = (state: GameState): ServiceCoverage => coverageOf(state).coverage;

// For each Home, the facilities that cover it only through Transit reach and the link that does.
export const transitReachLinks = (state: GameState): TransitReachLinks => coverageOf(state).viaTransit;

export type UncoveredReason = 'none' | 'outOfReach' | 'capacityFull' | WasteCause;

export function uncoveredReason(state: GameState, home: Building, type: ServiceKey): UncoveredReason {
  if (type === 'waste') return wasteCauseOf(wasteReport(state), home.id) ?? 'none';
  const facilities = state.buildings.filter(building => building.type === type);
  if (!facilities.length) return 'none';
  const { radius } = FACILITIES[type];
  if (radius !== null && !facilities.some(facility => isHomeInReach(facility, home, radius))) return 'outOfReach';
  return 'capacityFull';
}

export interface ReachLoad {
  citizensInReach: number;
  unservedCitizens: number;
  unservedHomes: number;
}

// Homes inside the reach of a non-Waste facility, and how many of them no facility of its type serves.
export function reachLoad(state: GameState, facility: Building): ReachLoad | null {
  const { radius } = FACILITIES[facility.type as FacilityType];
  if (radius === null) return null;
  const coverage = serviceCoverage(state);
  const inReach = state.buildings.filter(home => isHomeType(home.type) && isHomeInReach(facility, home, radius));
  const unserved = inReach.filter(home => !isServiceCovered(coverage, home.id, facility.type as FacilityType));
  return {
    citizensInReach: inReach.reduce((total, home) => total + citizensOf(home.tier), 0),
    unservedCitizens: unserved.reduce((total, home) => total + citizensOf(home.tier), 0),
    unservedHomes: unserved.length,
  };
}

export function isServiceCovered(coverage: ServiceCoverage, homeId: number, key: FacilityType): boolean {
  const covered = coverage.get(homeId);
  if (!covered) return false;
  return covered.has(key);
}

export function missingServices(coverage: ServiceCoverage, home: Building, tier = home.tier): FacilityType[] {
  return requiredServices(tier).filter(key => !isServiceCovered(coverage, home.id, key));
}

// Everything that keeps a Home from reaching the Tier: missing Public facilities and, from a high Tier, Waste coverage.
export function missingServicesOf(state: GameState, home: Building, tier = home.tier, coverage: ServiceCoverage = serviceCoverage(state)): ServiceKey[] {
  const wasteBlocks = tier >= WASTE_REQUIRED_TIER && isWasteMissing(state, home.id);
  return [...missingServices(coverage, home, tier), ...(wasteBlocks ? ['waste' as const] : [])];
}

export function coveredCategories(coverage: ServiceCoverage, homeId: number): ServiceCategory[] {
  const covered = coverage.get(homeId);
  if (!covered) return [];
  return SERVICE_CATEGORIES.filter(category => facilitiesOfCategory(category).some(type => covered.has(type)));
}

const STACKING_CATEGORIES: readonly ServiceCategory[] = ['culture', 'worship'];

export function coveredServiceUnits(coverage: ServiceCoverage, homeId: number): number {
  const covered = coverage.get(homeId);
  if (!covered) return 0;
  const stackingTypes = STACKING_CATEGORIES.flatMap(category => facilitiesOfCategory(category)).filter(type => covered.has(type)).length;
  const otherCategories = coveredCategories(coverage, homeId).filter(category => !STACKING_CATEGORIES.includes(category)).length;
  return otherCategories + stackingTypes;
}

export function categoryCoverageRatio(state: GameState, category: ServiceCategory): number {
  const coverage = serviceCoverage(state);
  const waste = category === 'waste' ? wasteReport(state) : null;
  let total = 0;
  let served = 0;
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const citizens = citizensOf(home.tier);
    total += citizens;
    if (waste ? isWasteCovered(waste, home.id) : coveredCategories(coverage, home.id).includes(category)) served += citizens;
  }
  return total > 0 ? served / total : 0;
}

export function homesLackingRequiredServices(state: GameState): Building[] {
  const coverage = serviceCoverage(state);
  return state.buildings.filter(building => isHomeType(building.type) && missingServicesOf(state, building, building.tier, coverage).length > 0);
}

// Homes a facility type covers: Waste coverage is shared by the three Waste facilities and needs a road link.
export function coveredHomeIds(state: GameState, type: FacilityType): ReadonlySet<number> {
  if (FACILITIES[type].category === 'waste') {
    const report = wasteReport(state);
    return new Set([...report.homes.keys()].filter(id => isWasteCovered(report, id)));
  }
  const coverage = serviceCoverage(state);
  return new Set([...coverage].filter(([, types]) => types.has(type)).map(([id]) => id));
}

export function previewFacilityCoverage(state: GameState, type: FacilityType, x: number, y: number, rotation: Rotation): Building[] {
  const before = coveredHomeIds(state, type);
  const probe = createBuilding(state.nextId, type, x, y, rotation);
  const after = coveredHomeIds({ ...state, buildings: [...state.buildings, probe] }, type);
  return state.buildings.filter(building => isHomeType(building.type) && after.has(building.id) && !before.has(building.id));
}
