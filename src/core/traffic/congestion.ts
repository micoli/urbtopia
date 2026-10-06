import { citizensOf } from '../buildings/city';
import type { BuildingType, Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { frontTiles } from '../map/placement';
import { accessNodes, crossingsOnPath, nearestTarget, pedestrianGraph, walkFrom, type PedestrianGraph } from '../map/pedestrianGraph';
import { buildRoadGraph, neighboursOf, type RoadGraph } from '../map/roadGraph';
import { FACILITY_TYPES } from '../services/facilities';
import { transportStats } from '../transit/transport';
import { jobsOf } from './jobs';
import { NO_SHIFT, modalShift, type ModalShift } from './modalShift';
import { CONGESTION, laneCapacity } from './roadTier';
import { BUS_TRAFFIC, busRouteTiles, busSpeedFactor, type BusRoute, type BusSpeed } from './busTraffic';
import { WALKING, crossingCut, maxWalkCost, walkDestinationOf } from './walking';
import { emptyTrips, walkDestinations, walkServices, type WalkingTrips } from './walkingTrips';

export const workplaceTypes: readonly BuildingType[] = ['workshop', 'factory', 'shop', 'casino', ...FACILITY_TYPES];

export interface SectionLoad {
  tile: Coord;
  load: number;
  capacity: number;
  ratio: number;
}

export interface CrossingLoad {
  tile: Coord;
  pedestrians: number;
  cut: number;
  saturated: boolean;
}

export interface HomeCongestion {
  commuters: number;
  walkers: number;
  walkAccess: number;
  unemployed: number;
  ratio: number;
  disconnected: boolean;
}

export interface CongestionStats {
  sections: ReadonlyMap<string, SectionLoad>;
  homes: ReadonlyMap<number, HomeCongestion>;
  index: number;
  commuters: number;
  walkers: number;
  walkingTrips: WalkingTrips;
  pedestrians: ReadonlyMap<string, number>;
  crossings: ReadonlyMap<string, CrossingLoad>;
  saturatedCrossings: number;
  busSpeeds: ReadonlyMap<number, BusSpeed>;
  speedFactors: ReadonlyMap<number, number>;
  slowedLines: number;
  modes: { car: number; transit: number; walking: number };
  jobs: number;
  unemployed: number;
  shift: ModalShift;
  worstBottleneck: SectionLoad | null;
  saturatedSections: number;
  disconnectedSections: readonly (readonly Coord[])[];
}

interface Endpoint {
  building: Building;
  access: Coord[];
  sidewalks: string[];
}

const statsCache = new WeakMap<GameState, { now: number; stats: CongestionStats }>();
const layoutCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; signature: string; stats: CongestionStats }>();

export function congestionStats(state: GameState, now = state.lastSeen): CongestionStats {
  const cached = statsCache.get(state);
  if (cached?.now === now) return cached.stats;
  const signature = layoutSignature(state, now);
  const layout = layoutCache.get(state.roads);
  const stats = layout?.roundabouts === state.roundabouts && layout.signature === signature ? layout.stats : withModalShift(state, now);
  layoutCache.set(state.roads, { roundabouts: state.roundabouts, signature, stats });
  statsCache.set(state, { now, stats });
  return stats;
}

function layoutSignature(state: GameState, now: number): string {
  const transport = transportStats(state, now);
  const buildings = state.buildings
    .filter((building) => building.type === 'home' || workplaceTypes.includes(building.type) || walkDestinationOf(building) !== null)
    .map((building) => `${building.id}:${building.type}:${building.x}:${building.y}:${building.rotation}:${building.tier}:${transport.homeRiders.get(building.id) ?? 0}`);
  const lines = transport.lines.map((line) => `${line.id}:${line.capacity.toFixed(2)}:${line.riders.toFixed(2)}:${line.mode === 'bus' && line.active && line.route ? line.route.map(tileKey).join(';') : ''}`);
  return [...buildings, ...lines].join('|');
}

function activeBusRoutes(transport: ReturnType<typeof transportStats>): BusRoute[] {
  return transport.lines.flatMap((line) => (line.mode === 'bus' && line.active && line.route ? [{ id: line.id, route: line.route }] : []));
}

function withModalShift(state: GameState, now: number): CongestionStats {
  const transport = transportStats(state, now);
  const buses = activeBusRoutes(transport);
  const first = calculateCongestion(state, transport.homeRiders, buses);
  const effective = first.speedFactors.size > 0 ? transportStats(state, now, first.speedFactors) : transport;
  const shift = modalShift(state, effective, first);
  if (shift.total === 0 && effective === transport) return first;
  const riders = new Map(effective.homeRiders);
  for (const [id, moved] of shift.byHome) riders.set(id, (riders.get(id) ?? 0) + moved);
  return { ...calculateCongestion(state, riders, buses), shift, busSpeeds: first.busSpeeds, speedFactors: first.speedFactors, slowedLines: first.slowedLines };
}

function calculateCongestion(state: GameState, riders: ReadonlyMap<number, number>, buses: readonly BusRoute[] = []): CongestionStats {
  const graph = buildRoadGraph(state);
  const tiers = new Map(state.roads.map((road) => [tileKey(road), road.tier ?? 1]));
  const walkable = pedestrianGraph(state);
  const homes = endpoints(state, graph, walkable, (building) => building.type === 'home');
  const workplaces = endpoints(state, graph, walkable, (building) => workplaceTypes.includes(building.type)).filter((workplace) => workplace.access.length > 0);
  const destinations = WALKING.enabled ? walkDestinations(state, walkable) : [];
  const pedestrians = new Map<string, number>();
  const walkingTrips = emptyTrips();
  const workplaceById = new Map(workplaces.map((workplace) => [workplace.building.id, workplace]));
  const jobs = workplaces.reduce((sum, workplace) => sum + jobsOf(workplace.building), 0);
  if (graph.size === 0 || workplaces.length === 0 || homes.length === 0) return noCommute(homes, jobs);
  const components = labelComponents(graph);
  const componentOf = (endpoint: Endpoint) => components.labels.get(tileKey(endpoint.access[0] ?? { x: NaN, y: NaN }));
  const homeComponents = new Set(homes.map(componentOf));
  const workplaceComponents = new Set(workplaces.map(componentOf));
  const brokenComponents = new Set([...components.members.keys()].filter((id) => homeComponents.has(id) !== workplaceComponents.has(id)));

  const loads = new Map<string, number>();
  const used = new Map<number, Set<string>>();
  const result = new Map<number, HomeCongestion>();
  const jobsLeft = new Map(workplaces.map((workplace) => [workplace.building.id, jobsOf(workplace.building)]));
  let commutersTotal = 0;
  let walkersTotal = 0;
  let transitTotal = 0;
  let unemployedTotal = 0;
  for (const home of homes) {
    const citizens = citizensOf(home.building.tier);
    const homeRiders = Math.min(citizens, riders.get(home.building.id) ?? 0);
    const wanting = citizens - homeRiders;
    transitTotal += homeRiders;
    const walk = walkFrom(walkable, WALKING.enabled ? home.sidewalks : [], maxWalkCost());
    const walkAccess = WALKING.enabled ? walkServices(walk, destinations, citizens, pedestrians, walkingTrips) : 0;
    const options = home.access.length === 0 ? [] : reachableWorkplaces(graph, home, workplaces);
    if (options.length === 0) {
      commutersTotal += wanting;
      result.set(home.building.id, { commuters: wanting, walkers: 0, walkAccess, unemployed: 0, ratio: CONGESTION.maxRatio, disconnected: true });
      continue;
    }
    const tiles = new Set<string>();
    let remaining = wanting;
    let walking = 0;
    for (const option of options) {
      const taken = Math.min(remaining, jobsLeft.get(option.id) ?? 0);
      if (taken <= 0) continue;
      jobsLeft.set(option.id, (jobsLeft.get(option.id) ?? 0) - taken);
      remaining -= taken;
      const target = WALKING.enabled ? nearestTarget(walk, workplaceById.get(option.id)?.sidewalks ?? []) : null;
      if (target !== null && target.cost <= WALKING.workThreshold) {
        walking += taken;
        for (const crossing of crossingsOnPath(walk, target.node)) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + taken);
        continue;
      }
      for (const tile of option.path) {
        const key = tileKey(tile);
        loads.set(key, (loads.get(key) ?? 0) + taken);
        tiles.add(key);
      }
    }
    commutersTotal += wanting - remaining - walking;
    walkersTotal += walking;
    unemployedTotal += remaining;
    used.set(home.building.id, tiles);
    result.set(home.building.id, { commuters: wanting - remaining - walking, walkers: walking, walkAccess, unemployed: remaining, ratio: 0, disconnected: false });
  }

  for (const bus of buses) {
    for (const key of busRouteTiles(bus.route)) loads.set(key, (loads.get(key) ?? 0) + BUS_TRAFFIC.load);
  }
  const sections = new Map<string, SectionLoad>();
  for (const [key, load] of loads) {
    const capacity = laneCapacity(tiers.get(key) ?? 1) * (1 - crossingCut(pedestrians.get(key) ?? 0));
    sections.set(key, { tile: parseTile(key), load, capacity, ratio: load / capacity });
  }
  const busSpeeds = new Map<number, BusSpeed>();
  for (const bus of buses) {
    const factor = busSpeedFactor(bus.route, (key) => sections.get(key)?.ratio ?? 0);
    busSpeeds.set(bus.id, { factor, slowed: factor < BUS_TRAFFIC.slowedBelow });
  }
  const crossings = new Map<string, CrossingLoad>();
  for (const [key, count] of pedestrians) {
    const cut = crossingCut(count);
    crossings.set(key, { tile: parseTile(key), pedestrians: count, cut, saturated: cut >= WALKING.maxCrossingCut });
  }
  let weighted = 0;
  let population = 0;
  for (const home of homes) {
    const entry = result.get(home.building.id)!;
    if (!entry.disconnected) {
      const worst = Math.max(0, ...[...(used.get(home.building.id) ?? [])].map((key) => sections.get(key)?.ratio ?? 0));
      entry.ratio = Math.min(CONGESTION.maxRatio, worst);
    }
    const citizens = citizensOf(home.building.tier);
    weighted += citizens * entry.ratio;
    population += citizens;
  }
  return {
    sections,
    homes: result,
    index: population > 0 ? weighted / population : 0,
    commuters: commutersTotal,
    walkers: walkersTotal,
    walkingTrips,
    pedestrians,
    crossings,
    saturatedCrossings: [...crossings.values()].filter((crossing) => crossing.saturated).length,
    busSpeeds,
    speedFactors: new Map([...busSpeeds].filter(([, speed]) => speed.factor < 1).map(([id, speed]) => [id, speed.factor])),
    slowedLines: [...busSpeeds.values()].filter((speed) => speed.slowed).length,
    modes: { car: commutersTotal, transit: transitTotal, walking: walkersTotal },
    jobs,
    unemployed: unemployedTotal,
    shift: NO_SHIFT,
    worstBottleneck: worstSection(sections),
    saturatedSections: [...sections.values()].filter((section) => section.ratio > 1).length,
    disconnectedSections: [...brokenComponents].map((id) => components.members.get(id)!),
  };
}

function noCommute(homes: Endpoint[], jobs: number): CongestionStats {
  return {
    sections: new Map(),
    homes: new Map(homes.map((home) => [home.building.id, { commuters: 0, walkers: 0, walkAccess: 0, unemployed: 0, ratio: 0, disconnected: false }])),
    index: 0,
    commuters: 0,
    walkers: 0,
    walkingTrips: emptyTrips(),
    pedestrians: new Map(),
    crossings: new Map(),
    saturatedCrossings: 0,
    busSpeeds: new Map(),
    speedFactors: new Map(),
    slowedLines: 0,
    modes: { car: 0, transit: 0, walking: 0 },
    jobs,
    unemployed: 0,
    shift: NO_SHIFT,
    worstBottleneck: null,
    saturatedSections: 0,
    disconnectedSections: [],
  };
}

export function worstSection(sections: ReadonlyMap<string, SectionLoad>): SectionLoad | null {
  let worst: SectionLoad | null = null;
  for (const section of sections.values()) {
    if (section.ratio <= 1) continue;
    if (worst === null || isWorse(section, worst)) worst = section;
  }
  return worst;
}

function isWorse(candidate: SectionLoad, current: SectionLoad): boolean {
  if (candidate.ratio !== current.ratio) return candidate.ratio > current.ratio;
  if (candidate.load !== current.load) return candidate.load > current.load;
  if (candidate.tile.y !== current.tile.y) return candidate.tile.y < current.tile.y;
  return candidate.tile.x < current.tile.x;
}

function endpoints(state: GameState, graph: RoadGraph, walkable: PedestrianGraph, matches: (building: Building) => boolean): Endpoint[] {
  return state.buildings
    .filter(matches)
    .sort((a, b) => a.id - b.id)
    .map((building) => ({
      building,
      access: frontTiles(building.type, building.x, building.y, building.rotation, building.tier).filter((tile) => graph.has(tileKey(tile))),
      sidewalks: accessNodes(state, walkable, building),
    }));
}

function labelComponents(graph: RoadGraph): { labels: Map<string, number>; members: Map<number, Coord[]> } {
  const labels = new Map<string, number>();
  const members = new Map<number, Coord[]>();
  for (const start of graph.keys()) {
    if (labels.has(start)) continue;
    const id = members.size;
    const tiles: Coord[] = [];
    const queue = [start];
    labels.set(start, id);
    for (let index = 0; index < queue.length; index++) {
      const key = queue[index]!;
      tiles.push(parseTile(key));
      for (const next of neighboursOf(graph, parseTile(key))) {
        const nextKey = tileKey(next);
        if (labels.has(nextKey)) continue;
        labels.set(nextKey, id);
        queue.push(nextKey);
      }
    }
    members.set(id, tiles);
  }
  return { labels, members };
}

function reachableWorkplaces(graph: RoadGraph, home: Endpoint, workplaces: Endpoint[]): { id: number; path: Coord[] }[] {
  const parents = new Map<string, string | null>();
  const queue: string[] = [];
  for (const tile of home.access) {
    const key = tileKey(tile);
    if (parents.has(key)) continue;
    parents.set(key, null);
    queue.push(key);
  }
  for (let index = 0; index < queue.length; index++) {
    const key = queue[index]!;
    for (const next of neighboursOf(graph, parseTile(key))) {
      const nextKey = tileKey(next);
      if (parents.has(nextKey)) continue;
      parents.set(nextKey, key);
      queue.push(nextKey);
    }
  }
  const order = new Map(queue.map((key, index) => [key, index]));
  const options: { id: number; path: Coord[] }[] = [];
  for (const workplace of workplaces) {
    const reached = workplace.access.map(tileKey).filter((key) => parents.has(key)).sort((a, b) => order.get(a)! - order.get(b)!)[0];
    if (reached === undefined) continue;
    options.push({ id: workplace.building.id, path: traceBack(parents, reached) });
  }
  return options.sort((a, b) => a.path.length - b.path.length || a.id - b.id);
}

function traceBack(parents: Map<string, string | null>, end: string): Coord[] {
  const path: Coord[] = [];
  for (let key: string | null | undefined = end; key !== null && key !== undefined; key = parents.get(key)) path.push(parseTile(key));
  return path;
}

function parseTile(key: string): Coord {
  const [x = 0, y = 0] = key.split(',').map(Number);
  return { x, y };
}
