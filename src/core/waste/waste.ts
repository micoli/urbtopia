import { isHomeType } from '../buildings/buildingDefinitions';
import { difficultyOf } from '../engine/difficulty';
import { isAdapting } from '../environment/adaptation';
import type { Building, GameState } from '../engine/state';
import { tileKey } from '../map/geometry';
import { citizensOf, totalCitizens } from '../buildings/city';
import type { Coord } from '../map/coord';
import { hourOf, recyclingPlantPowerRatios } from './wastePower';
import { componentsOf, pedestrianDistances, pedestrianTileDistances, roadLinks, routeDistances, tilesOfBuilding, outsideNeighbours, type RoadComponents, type RoadLinks } from './wasteLinks';
import { wasteReductionOf } from '../politics/ordinanceEffects';
import { layoutOf } from '../buildings/buildingIndex';
import { WASTE, WASTE_FACILITIES, WASTE_KINDS, WASTE_REQUIRED_FROM_CITIZENS, homeWasteProduction, wasteCapacity, wasteKindOf, type WasteKind } from './wasteBalance';

export type WasteCause = 'noFacility' | 'capacityFull' | 'beyondMaxDistance' | 'noRoadLink' | 'beyondCarryingDistance' | 'facilityStopped';

export interface HomeWaste {
  produced: number;
  facilityId: number | null;
  cost: number;
  carried: boolean;
  // The length of the route, in tiles, from the facility that serves the Home.
  distance: number | null;
  cause: WasteCause | null;
  // Full because a Recycling plant that would serve it receives too little power.
  powerReduced: boolean;
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
  roadComponents: ReadonlySet<number>;
  // The shortest route, in tiles, from the facility to each Road tile within its Collection distance.
  routes: ReadonlyMap<string, number>;
}

// A route to a Home no longer than the Collection distance; 'tooFar' joins the Home by a longer one; 'beyond' needs a longer walk than the Carrying distance.
type Link = { carried: boolean; distance: number } | 'beyond' | 'tooFar' | null;

interface ReachingFacility {
  link: Link;
  running: boolean;
  powerRatio: number;
}

const stateCache = new WeakMap<GameState, WasteReport>();
const cache = new WeakMap<object, { roads: GameState['roads']; roundabouts: GameState['roundabouts']; pedestrianWays: GameState['pedestrianWays']; paying: boolean; adapting: boolean; hour: number; reduction: number; power: string; report: WasteReport }>();

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

function facilityGeometries(state: GameState, components: RoadComponents, links: RoadLinks): FacilityGeometry[] {
  const facilities = state.buildings.flatMap(building => {
    const kind = wasteKindOf(building.type);
    return kind ? [{ building, kind }] : [];
  });
  const roadTiles = new Set(links.keys());
  const adjacentRoads = (tiles: readonly Coord[]): Map<string, number> =>
    new Map(outsideNeighbours(tiles).map(tileKey).filter(key => roadTiles.has(key)).map(key => [key, 1]));
  const moundGroups = adjacentMoundGroups(facilities.filter(({ kind }) => kind === 'mound').map(({ building }) => building));
  const groupSources = new Map<number, { components: Set<number>; sources: Map<string, number> }>();
  for (const group of moundGroups) {
    const tiles = group.flatMap(mound => tilesOfBuilding(mound));
    const sources = adjacentRoads(tiles);
    for (const [key, walk] of pedestrianTileDistances(state, tiles, WASTE_FACILITIES.mound.collectionDistance, roadTiles)) sources.set(key, Math.min(sources.get(key) ?? Infinity, walk + 1));
    const joined = new Set([...sources.keys()].flatMap(key => components.get(key) ?? []));
    for (const component of pedestrianDistances(state, components, tiles, Infinity).keys()) joined.add(component);
    for (const mound of group) groupSources.set(mound.id, { components: joined, sources });
  }
  return facilities.map(({ building, kind }) => {
    const own = kind === 'mound' ? groupSources.get(building.id)! : null;
    const sources = own?.sources ?? adjacentRoads(tilesOfBuilding(building));
    const reachable = own?.components ?? new Set([...sources.keys()].flatMap(key => components.get(key) ?? []));
    return { building, kind, roadComponents: reachable, routes: routeDistances(links, sources, WASTE_FACILITIES[kind].collectionDistance) };
  });
}

interface HomeRoutes {
  roads: ReadonlySet<number>;
  roadKeys: readonly string[];
  // Without a Road in front: the walk to each Road tile the Pedestrian path network reaches.
  walk: ReadonlyMap<string, number> | null;
}

function linkOf(facility: FacilityGeometry, home: HomeRoutes, components: RoadComponents): Link {
  const { collectionDistance } = WASTE_FACILITIES[facility.kind];
  if ([...home.roads].some(component => facility.roadComponents.has(component))) {
    const lengths = home.roadKeys.flatMap(key => facility.routes.get(key) ?? []);
    return lengths.length > 0 ? { carried: false, distance: Math.min(...lengths) } : 'tooFar';
  }
  if (!home.walk) return null;
  const reached = [...home.walk].filter(([key]) => facility.roadComponents.has(components.get(key) ?? -1));
  if (reached.length === 0) return null;
  const near = reached.filter(([, walk]) => walk <= WASTE.carryingDistance);
  if (near.length === 0) return 'beyond';
  const totals = near.flatMap(([key, walk]) => (facility.routes.has(key) ? facility.routes.get(key)! + walk : []));
  const distance = totals.length > 0 ? Math.min(...totals) : Infinity;
  return distance <= collectionDistance ? { carried: true, distance } : 'tooFar';
}

const isLinked = ({ link }: ReachingFacility) => link !== null && link !== 'beyond' && link !== 'tooFar';

function causeOf(reaching: readonly ReachingFacility[]): WasteCause {
  const linked = reaching.filter(isLinked);
  if (linked.length > 0) return linked.some(({ running }) => running) ? 'capacityFull' : 'facilityStopped';
  if (reaching.some(({ link }) => link === 'tooFar')) return 'beyondMaxDistance';
  if (reaching.some(({ link }) => link === 'beyond')) return 'beyondCarryingDistance';
  return 'noRoadLink';
}

function withoutFacilities(homes: readonly Building[], required: boolean, reduction: number): WasteReport {
  const results = new Map<number, HomeWaste>(homes.map(home => [home.id, { produced: homeWasteProduction(home.tier, reduction), facilityId: null, cost: 0, carried: false, distance: null, cause: 'noFacility', powerReduced: false }]));
  return { required, homes: results, facilities: new Map(), produced: [...results.values()].reduce((sum, home) => sum + home.produced, 0), processed: 0, costPerDay: 0, costPerHour: 0 };
}

function computeReport(state: GameState, paying: boolean, powerRatios: ReadonlyMap<number, number>): WasteReport {
  const homes = state.buildings.filter(building => isHomeType(building.type)).sort((a, b) => a.id - b.id);
  const required = totalCitizens(state) >= WASTE_REQUIRED_FROM_CITIZENS;
  const reduction = wasteReductionOf(state);
  if (!state.buildings.some(building => wasteKindOf(building.type))) return withoutFacilities(homes, required, reduction);
  const links = roadLinks(state);
  const components = componentsOf(links);
  const roadTiles = new Set(links.keys());
  const facilities = facilityGeometries(state, components, links);
  const homeData = homes.map(home => {
    const tiles = tilesOfBuilding(home);
    const roadKeys = outsideNeighbours(tiles).map(tileKey).filter(key => roadTiles.has(key));
    const roads = new Set(roadKeys.flatMap(key => components.get(key) ?? []));
    return { home, produced: homeWasteProduction(home.tier, reduction), routes: { roads, roadKeys, walk: roads.size === 0 ? pedestrianTileDistances(state, tiles, Infinity, roadTiles) : null } satisfies HomeRoutes };
  });
  const results = new Map<number, HomeWaste>();
  const facilityResults = new Map<number, FacilityWaste>(facilities.map(({ building, kind, roadComponents: reachable }) => {
    const nominalCapacity = wasteCapacity(kind, building.tier);
    const powerRatio = powerRatios.get(building.id) ?? 1;
    return [building.id, { kind, capacity: nominalCapacity * powerRatio, nominalCapacity, powerRatio, processed: 0, cost: 0, linked: reachable.size > 0 }];
  }));
  const isRunning = (facility: FacilityGeometry) => paying && facilityResults.get(facility.building.id)!.powerRatio > 0;

  if (paying) {
    for (const kind of WASTE_KINDS) {
      for (const facility of facilities.filter(candidate => candidate.kind === kind).sort((a, b) => a.building.id - b.building.id)) {
        const served = facilityResults.get(facility.building.id)!;
        if (!isRunning(facility)) continue;
        const { tariff, collectionDistance } = WASTE_FACILITIES[kind];
        const candidates = homeData
          .filter(data => !results.has(data.home.id))
          .flatMap(data => {
            const link = linkOf(facility, data.routes, components);
            return typeof link === 'object' && link !== null ? [{ data, link }] : [];
          })
          .sort((a, b) => a.link.distance - b.link.distance || a.data.home.id - b.data.home.id);
        for (const { data, link } of candidates) {
          if (served.processed >= served.capacity) break;
          const cost = data.produced * tariff * (1 + link.distance / collectionDistance) * (link.carried ? WASTE.carriedSurcharge : 1);
          results.set(data.home.id, { produced: data.produced, facilityId: facility.building.id, cost, carried: link.carried, distance: link.distance, cause: null, powerReduced: false });
          served.processed += data.produced;
          served.cost += cost;
        }
      }
    }
  }

  for (const data of homeData) {
    if (results.has(data.home.id)) continue;
    const reaching = facilities.map(facility => ({ link: linkOf(facility, data.routes, components), running: isRunning(facility), powerRatio: facilityResults.get(facility.building.id)!.powerRatio }));
    const cause = causeOf(reaching);
    const powerReduced = cause === 'capacityFull' && reaching.some(facility => isLinked(facility) && facility.running && facility.powerRatio < 1);
    results.set(data.home.id, { produced: data.produced, facilityId: null, cost: 0, carried: false, distance: null, cause, powerReduced });
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
  const known = stateCache.get(state);
  if (known) return known;
  const report = layoutReport(state);
  stateCache.set(state, report);
  return report;
}

function layoutReport(state: GameState): WasteReport {
  const paying = state.urbs > 1e-9;
  const adapting = isAdapting(state);
  const hour = hourOf(state);
  const reduction = wasteReductionOf(state);
  const powerRatios = recyclingPlantPowerRatios(state);
  const power = [...powerRatios].join(';');
  const layout = layoutOf(state.buildings);
  const cached = cache.get(layout);
  if (cached && cached.adapting === adapting && cached.hour === hour && cached.roads === state.roads && cached.roundabouts === state.roundabouts && cached.pedestrianWays === state.pedestrianWays && cached.paying === paying && cached.reduction === reduction && cached.power === power) return cached.report;
  const report = computeReport(state, paying, powerRatios);
  cache.set(layout, { roads: state.roads, roundabouts: state.roundabouts, pedestrianWays: state.pedestrianWays, paying, adapting, hour, reduction, power, report });
  return report;
}

export function isWasteCovered(report: WasteReport, homeId: number): boolean {
  return report.homes.get(homeId)?.cause === null;
}

export function isWastePowerReduced(report: WasteReport, homeId: number): boolean {
  return report.homes.get(homeId)?.powerReduced ?? false;
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

export function wasteCitizensServedBy(state: GameState, facilityId: number): number {
  const report = wasteReport(state);
  return state.buildings.reduce((total, building) => {
    if (!isHomeType(building.type)) return total;
    return report.homes.get(building.id)?.facilityId === facilityId ? total + citizensOf(building.tier) : total;
  }, 0);
}
