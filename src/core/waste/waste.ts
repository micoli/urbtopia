import { isHomeType } from '../buildings/buildingDefinitions';
import { difficultyOf } from '../engine/difficulty';
import { isAdapting } from '../environment/adaptation';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { isWithinReach } from '../services/facilities';
import { totalCitizens } from '../buildings/city';
import { hourOf, recyclingPlantPowerRatios } from './wastePower';
import { footprintOfBuilding, pedestrianDistances, roadComponents, tilesOfBuilding, touchedRoadComponents, outsideNeighbours } from './wasteLinks';
import { WASTE, WASTE_FACILITIES, WASTE_KINDS, WASTE_REQUIRED_FROM_CITIZENS, homeWasteProduction, wasteCapacity, wasteKindOf, type WasteKind } from './wasteBalance';

export type WasteCause = 'outOfReach' | 'capacityFull' | 'noRoadLink' | 'beyondCarryingDistance' | 'facilityStopped';

export interface HomeWaste {
  produced: number;
  facilityId: number | null;
  cost: number;
  carried: boolean;
  cause: WasteCause | null;
}

export interface FacilityWaste {
  kind: WasteKind;
  capacity: number;
  nominalCapacity: number;
  powerRatio: number;
  processed: number;
  cost: number;
  linked: boolean;
}

export interface WasteReport {
  // The city is big enough to be expected to handle its Waste.
  required: boolean;
  homes: ReadonlyMap<number, HomeWaste>;
  facilities: ReadonlyMap<number, FacilityWaste>;
  produced: number;
  processed: number;
  costPerDay: number;
  costPerHour: number;
}

interface FacilityGeometry {
  building: Building;
  kind: WasteKind;
  center: Coord;
  roadComponents: ReadonlySet<number>;
}

type Link = { carried: boolean } | 'beyond' | null;

interface ReachingFacility {
  link: Link;
  running: boolean;
}

const cache = new WeakMap<readonly Building[], { roads: GameState['roads']; roundabouts: GameState['roundabouts']; pedestrianWays: GameState['pedestrianWays']; paying: boolean; adapting: boolean; hour: number; report: WasteReport }>();

function centerOf(building: Building): Coord {
  const { width, depth } = footprintOfBuilding(building);
  return { x: building.x + width / 2, y: building.y + depth / 2 };
}

const manhattan = (a: Coord, b: Coord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function adjacentMoundGroups(mounds: readonly Building[]): Building[][] {
  const tilesOf = new Map(mounds.map(mound => [mound.id, tilesOfBuilding(mound)]));
  const touching = (a: Building, b: Building) => {
    const keys = new Set(outsideNeighbours(tilesOf.get(a.id)!).map(tileKey));
    return tilesOf.get(b.id)!.some(tile => keys.has(tileKey(tile)));
  };
  const groups: Building[][] = [];
  const seen = new Set<number>();
  for (const mound of mounds) {
    if (seen.has(mound.id)) continue;
    const group = [mound];
    seen.add(mound.id);
    for (let index = 0; index < group.length; index++) {
      for (const other of mounds) {
        if (seen.has(other.id) || !touching(group[index]!, other)) continue;
        seen.add(other.id);
        group.push(other);
      }
    }
    groups.push(group);
  }
  return groups;
}

function facilityGeometries(state: GameState, components: ReturnType<typeof roadComponents>): FacilityGeometry[] {
  const facilities = state.buildings.flatMap(building => {
    const kind = wasteKindOf(building.type);
    return kind ? [{ building, kind }] : [];
  });
  const own = (building: Building) => touchedRoadComponents(components, tilesOfBuilding(building));
  const geometry = (entry: { building: Building; kind: WasteKind }, roadComponentsOf: ReadonlySet<number>): FacilityGeometry => ({ ...entry, center: centerOf(entry.building), roadComponents: roadComponentsOf });
  const moundGroups = adjacentMoundGroups(facilities.filter(({ kind }) => kind === 'mound').map(({ building }) => building));
  const groupComponents = new Map<number, Set<number>>();
  for (const group of moundGroups) {
    const tiles = group.flatMap(mound => tilesOfBuilding(mound));
    const joined = new Set([...group.flatMap(mound => [...own(mound)]), ...pedestrianDistances(state, components, tiles, Infinity).keys()]);
    for (const mound of group) groupComponents.set(mound.id, joined);
  }
  return facilities.map(entry => geometry(entry, entry.kind === 'mound' ? groupComponents.get(entry.building.id)! : own(entry.building)));
}

function linkOf(facility: FacilityGeometry, homeRoads: ReadonlySet<number>, homeWalk: ReadonlyMap<number, number> | null): Link {
  if ([...homeRoads].some(component => facility.roadComponents.has(component))) return { carried: false };
  if (!homeWalk) return null;
  const walks = [...facility.roadComponents].flatMap(component => homeWalk.get(component) ?? []);
  if (walks.length === 0) return null;
  return Math.min(...walks) <= WASTE.carryingDistance ? { carried: true } : 'beyond';
}

function causeOf(reaching: readonly ReachingFacility[]): WasteCause {
  const linked = reaching.filter(({ link }) => link !== null && link !== 'beyond');
  if (linked.length > 0) return linked.some(({ running }) => running) ? 'capacityFull' : 'facilityStopped';
  if (reaching.some(({ link }) => link === 'beyond')) return 'beyondCarryingDistance';
  return 'noRoadLink';
}

function withoutFacilities(homes: readonly Building[], required: boolean): WasteReport {
  const results = new Map<number, HomeWaste>(homes.map(home => [home.id, { produced: homeWasteProduction(home.tier), facilityId: null, cost: 0, carried: false, cause: 'outOfReach' }]));
  return { required, homes: results, facilities: new Map(), produced: [...results.values()].reduce((sum, home) => sum + home.produced, 0), processed: 0, costPerDay: 0, costPerHour: 0 };
}

function computeReport(state: GameState, paying: boolean): WasteReport {
  const homes = state.buildings.filter(building => isHomeType(building.type)).sort((a, b) => a.id - b.id);
  const required = totalCitizens(state) >= WASTE_REQUIRED_FROM_CITIZENS;
  if (!state.buildings.some(building => wasteKindOf(building.type))) return withoutFacilities(homes, required);
  const components = roadComponents(state);
  const facilities = facilityGeometries(state, components);
  const homeData = homes.map(home => {
    const tiles = tilesOfBuilding(home);
    const roads = touchedRoadComponents(components, tiles);
    return { home, center: centerOf(home), produced: homeWasteProduction(home.tier), roads, walk: roads.size === 0 ? pedestrianDistances(state, components, tiles, Infinity) : null };
  });
  const results = new Map<number, HomeWaste>();
  const powerRatios = recyclingPlantPowerRatios(state);
  const facilityResults = new Map<number, FacilityWaste>(facilities.map(({ building, kind, roadComponents: reachable }) => {
    const nominalCapacity = wasteCapacity(kind, building.tier);
    const powerRatio = powerRatios.get(building.id) ?? 1;
    return [building.id, { kind, capacity: nominalCapacity * powerRatio, nominalCapacity, powerRatio, processed: 0, cost: 0, linked: reachable.size > 0 }];
  }));
  const isRunning = (facility: FacilityGeometry) => paying && facilityResults.get(facility.building.id)!.powerRatio > 0;
  const reaches = (facility: FacilityGeometry, center: Coord) => isWithinReach(center.x - facility.center.x, center.y - facility.center.y, WASTE_FACILITIES[facility.kind].reach);

  if (paying) {
    for (const kind of WASTE_KINDS) {
      for (const facility of facilities.filter(candidate => candidate.kind === kind).sort((a, b) => a.building.id - b.building.id)) {
        const served = facilityResults.get(facility.building.id)!;
        if (!isRunning(facility)) continue;
        const candidates = homeData
          .filter(data => !results.has(data.home.id) && reaches(facility, data.center))
          .flatMap(data => {
            const link = linkOf(facility, data.roads, data.walk);
            return link === null || link === 'beyond' ? [] : [{ data, link, distance: manhattan(facility.center, data.center) }];
          })
          .sort((a, b) => a.distance - b.distance || a.data.home.id - b.data.home.id);
        for (const { data, link } of candidates) {
          if (served.processed >= served.capacity) break;
          const cost = data.produced * WASTE_FACILITIES[kind].tariff * (link.carried ? WASTE.carriedSurcharge : 1);
          results.set(data.home.id, { produced: data.produced, facilityId: facility.building.id, cost, carried: link.carried, cause: null });
          served.processed += data.produced;
          served.cost += cost;
        }
      }
    }
  }

  for (const data of homeData) {
    if (results.has(data.home.id)) continue;
    const reaching = facilities.filter(facility => reaches(facility, data.center));
    const cause = reaching.length === 0 ? 'outOfReach' : causeOf(reaching.map(facility => ({ link: linkOf(facility, data.roads, data.walk), running: isRunning(facility) })));
    results.set(data.home.id, { produced: data.produced, facilityId: null, cost: 0, carried: false, cause });
  }

  const totals = [...results.values()];
  const costPerDay = [...facilityResults.values()].reduce((sum, facility) => sum + facility.cost, 0);
  return {
    required,
    homes: results,
    facilities: facilityResults,
    produced: totals.reduce((sum, home) => sum + home.produced, 0),
    processed: [...facilityResults.values()].reduce((sum, facility) => sum + facility.processed, 0),
    costPerDay,
    costPerHour: costPerDay / WASTE.dayHours,
  };
}

// Facilities that cannot pay stop at once: with no Urbs left nothing is processed. A Recycling plant processes in proportion to the power it receives.
export function wasteReport(state: GameState): WasteReport {
  const paying = state.urbs > 1e-9;
  const adapting = isAdapting(state);
  const hour = hourOf(state);
  const cached = cache.get(state.buildings);
  if (cached && cached.adapting === adapting && cached.hour === hour && cached.roads === state.roads && cached.roundabouts === state.roundabouts && cached.pedestrianWays === state.pedestrianWays && cached.paying === paying) return cached.report;
  const report = computeReport(state, paying);
  cache.set(state.buildings, { roads: state.roads, roundabouts: state.roundabouts, pedestrianWays: state.pedestrianWays, paying, adapting, hour, report });
  return report;
}

export function isWasteCovered(report: WasteReport, homeId: number): boolean {
  return report.homes.get(homeId)?.cause === null;
}

export function wasteCauseOf(report: WasteReport, homeId: number): WasteCause | null {
  return report.homes.get(homeId)?.cause ?? null;
}

export function wasteCostPerHour(state: GameState): number {
  return wasteReport(state).costPerHour;
}

export function isWasteSanctioned(state: GameState, homeId: number): boolean {
  if (difficultyOf(state) === 'cozy' || isAdapting(state)) return false;
  if (!wasteReport(state).required) return false;
  return wasteCauseOf(wasteReport(state), homeId) !== null;
}

// A Home that must be covered and is not: it loses Well-being, and a high Tier cannot be reached.
export function isWasteMissing(state: GameState, homeId: number): boolean {
  if (isAdapting(state)) return false;
  const report = wasteReport(state);
  return report.required && !isWasteCovered(report, homeId);
}
