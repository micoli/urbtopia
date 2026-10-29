import { citizensOf } from '../buildings/city';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { footprintTiles } from '../buildings/buildingSpecs';
import { frontAccessModes, frontTiles, hasBrtOnlyAccess } from '../map/placement';
import { accessNodes, crossingsOnPath, nearestTarget, nodesOnPath, pedestrianGraph, walkFrom, workAccessNodes, type PedestrianGraph } from '../map/pedestrianGraph';
import { buildRoadGraph, neighboursOf, type RoadGraph } from '../map/roadGraph';
import { transportStats } from '../transit/transport';
import { closedFractionsByTile } from '../water/bridgeOpenings';
import { jobsOf, workplaceTypes } from './jobs';
import { NO_SHIFT, modalShift, type ModalShift } from './modalShift';
import { CONGESTION, laneCapacity } from './roadTier';
import { BUS_TRAFFIC, busRouteTiles, busSpeedFactor, type BusRoute, type BusSpeed } from './busTraffic';
import { WALKING, crossingCut, maxWalkCost, walkDestinationOf } from './walking';
import { emptyTrips, walkDestinations, walkServices, type WalkingTrips } from './walkingTrips';
import { isHomeType } from '../buildings/buildingDefinitions';
import { movingGathering } from '../tourism/gatheringWindow';
import { isAttraction } from '../tourism/tourists';
import { ticketOf } from '../tourism/takings';
import { TOURIST_GATES, touristFlows, type TouristFlow } from '../tourism/touristFlows';
import { congestionReliefOf } from '../politics/ordinanceEffects';

export { workplaceTypes };

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
  cyclists: number;
  walkAccess: number;
  unemployed: number;
  ratio: number;
  disconnected: boolean;
}

export type TripMode = 'car' | 'walk' | 'cycle';

// Citizens leaving one Home for one building, by mode.
export interface TripFlow {
  from: number;
  to: number;
  mode: TripMode;
  count: number;
  // The tiles of the Road or Sidewalk route taken.
  path: readonly Coord[];
}

export interface CongestionStats {
  sections: ReadonlyMap<string, SectionLoad>;
  homes: ReadonlyMap<number, HomeCongestion>;
  index: number;
  commuters: number;
  walkers: number;
  cyclists: number;
  walkingTrips: WalkingTrips;
  cyclingTrips: WalkingTrips;
  pedestrians: ReadonlyMap<string, number>;
  sidewalkLoads: ReadonlyMap<string, number>;
  // Commuters driving to, and Pedestrians walking to, each building; and the walking trips leaving each Home.
  carArrivals: ReadonlyMap<number, number>;
  walkArrivals: ReadonlyMap<number, number>;
  walkTripsByHome: ReadonlyMap<number, number>;
  // Every trip from a Home to a workplace or a service on foot; Riders of public transport have no destination.
  trips: readonly TripFlow[];
  // How the Tourists reach each Attraction; they have no Home, so they are apart from the trips.
  touristFlows: readonly TouristFlow[];
  crossings: ReadonlyMap<string, CrossingLoad>;
  saturatedCrossings: number;
  busSpeeds: ReadonlyMap<number, BusSpeed>;
  speedFactors: ReadonlyMap<number, number>;
  slowedLines: number;
  modes: { car: number; transit: number; walking: number; cycling: number };
  jobs: number;
  filledJobs: ReadonlyMap<number, number>;
  unemployed: number;
  shift: ModalShift;
  worstBottleneck: SectionLoad | null;
  saturatedSections: number;
  disconnectedSections: readonly (readonly Coord[])[];
}

interface TransitCoverage {
  homes: ReadonlySet<number>;
  activities: ReadonlySet<number>;
}

interface Endpoint {
  building: Building;
  access: Coord[];
  sidewalks: string[];
}

const statsCache = new WeakMap<GameState, { now: number; stats: CongestionStats }>();
// Several variants of a city can share one Roads array (the dashboard also asks for the city without its Casinos): keep a few layouts per Roads array so they never evict each other.
const LAYOUTS_PER_ROADS = 4;
const layoutCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; pedestrianWays: GameState['pedestrianWays']; byLayout: Map<string, CongestionStats> }>();

export function congestionStats(state: GameState, now = state.lastSeen): CongestionStats {
  const cached = statsCache.get(state);
  if (cached?.now === now) return cached.stats;
  const signature = layoutSignature(state, now);
  const known = layoutCache.get(state.roads);
  const layout = known?.roundabouts === state.roundabouts && known.pedestrianWays === state.pedestrianWays ? known : { roundabouts: state.roundabouts, pedestrianWays: state.pedestrianWays, byLayout: new Map<string, CongestionStats>() };
  const stats = layout.byLayout.get(signature) ?? withModalShift(state, now);
  layout.byLayout.delete(signature);
  layout.byLayout.set(signature, stats);
  if (layout.byLayout.size > LAYOUTS_PER_ROADS) layout.byLayout.delete(layout.byLayout.keys().next().value!);
  layoutCache.set(state.roads, layout);
  statsCache.set(state, { now, stats });
  return stats;
}

function layoutSignature(state: GameState, now: number): string {
  const transport = transportStats(state, now);
  const buildings = state.buildings
    .filter((building) => isHomeType(building.type) || workplaceTypes.includes(building.type) || walkDestinationOf(building) !== null || isAttraction(building) || (TOURIST_GATES as readonly string[]).includes(building.type))
    .map((building) => `${building.id}:${building.type}:${building.x}:${building.y}:${building.rotation}:${building.tier}:${isAttraction(building) ? ticketOf(building) : ''}:${transport.homeRiders.get(building.id) ?? 0}:${transport.homeLines.has(building.id) ? 1 : 0}${transport.coveredActivities.has(building.id) ? 1 : 0}:${frontAccessModes(state, building.type, building.x, building.y, building.rotation, building.tier).join('+')}`);
  const lines = transport.lines.map((line) => `${line.id}:${line.capacity.toFixed(2)}:${line.riders.toFixed(2)}:${line.mode === 'bus' && line.active && line.route ? line.route.map(tileKey).join(';') : ''}`);
  const openings = [...closedFractionsByTile(state)].map(([key, fraction]) => `${key}=${fraction.toFixed(3)}`);
  const pedestrianWays = (state.pedestrianWays ?? []).map(tileKey).sort().join(';');
  const gatherings = state.buildings.flatMap((building) => (movingGathering(building, now) ? [`${building.id}`] : [])).join(',');
  return [`relief=${congestionReliefOf(state)}`, `gatherings=${gatherings}`, pedestrianWays, ...buildings, ...lines, ...openings].join('|');
}

function activeBusRoutes(transport: ReturnType<typeof transportStats>): BusRoute[] {
  return transport.lines.flatMap((line) => (line.mode === 'bus' && line.active && line.route ? [{ id: line.id, route: line.route }] : []));
}

function withModalShift(state: GameState, now: number): CongestionStats {
  const transport = transportStats(state, now);
  const buses = activeBusRoutes(transport);
  const covered: TransitCoverage = { homes: new Set(transport.homeLines.keys()), activities: transport.coveredActivities };
  const first = calculateCongestion(state, now, transport.homeRiders, covered, buses);
  const effective = first.speedFactors.size > 0 ? transportStats(state, now, first.speedFactors) : transport;
  const shift = modalShift(state, effective, first);
  if (shift.total === 0 && effective === transport) return first;
  const riders = new Map(effective.homeRiders);
  for (const [id, moved] of shift.byHome) riders.set(id, (riders.get(id) ?? 0) + moved);
  return { ...calculateCongestion(state, now, riders, covered, buses), shift, busSpeeds: first.busSpeeds, speedFactors: first.speedFactors, slowedLines: first.slowedLines };
}

function calculateCongestion(state: GameState, now: number, riders: ReadonlyMap<number, number>, covered: TransitCoverage, buses: readonly BusRoute[] = []): CongestionStats {
  const graph = buildRoadGraph(state);
  const tiers = new Map(state.roads.map((road) => [tileKey(road), road.tier ?? 1]));
  const closed = closedFractionsByTile(state);
  const walkable = pedestrianGraph(state);
  const homes = endpoints(state, graph, walkable, (building) => isHomeType(building.type));
  // A workplace reached by BRT only is staffed by Riders, so the Citizens never walk or drive to it.
  const workplaces = endpoints(state, graph, walkable, (building) => workplaceTypes.includes(building.type) && !hasBrtOnlyAccess(state, building), workAccessNodes).filter((workplace) => workplace.access.length > 0 || workplace.sidewalks.length > 0);
  const destinations = WALKING.enabled ? walkDestinations(state, walkable) : [];
  const pedestrians = new Map<string, number>();
  const sidewalkLoads = new Map<string, number>();
  const carArrivals = new Map<number, number>();
  const walkArrivals = new Map<number, number>();
  const walkTripsByHome = new Map<number, number>();
  const trips: TripFlow[] = [];
  const walkingTrips = emptyTrips();
  const cyclingTrips = emptyTrips();
  const workplaceById = new Map(workplaces.map((workplace) => [workplace.building.id, workplace]));
  const jobs = workplaces.reduce((sum, workplace) => sum + jobsOf(workplace.building), 0) + brtOnlyJobs(state, covered);
  if ((graph.size === 0 && walkable.size === 0) || workplaces.length === 0 || homes.length === 0) return noCommute(state, homes, jobs, covered, riders);
  const components = labelComponents(graph);
  const componentOf = (endpoint: Endpoint) => components.labels.get(tileKey(endpoint.access[0] ?? { x: NaN, y: NaN }));
  const homeComponents = new Set(homes.map(componentOf));
  const workplaceComponents = new Set(workplaces.map(componentOf));
  const brokenComponents = new Set([...components.members.keys()].filter((id) => homeComponents.has(id) !== workplaceComponents.has(id)));

  const loads = new Map<string, number>();
  const used = new Map<number, Set<string>>();
  const result = new Map<number, HomeCongestion>();
  const jobsLeft = new Map(workplaces.map((workplace) => [workplace.building.id, jobsOf(workplace.building)]));
  const reachable = new Set<number>();
  let commutersTotal = 0;
  let walkersTotal = 0;
  let cyclistsTotal = 0;
  let transitTotal = 0;
  let unemployedTotal = 0;
  const brtOnlyDisconnected: Coord[][] = [];
  for (const home of homes) {
    const citizens = citizensOf(home.building.tier);
    const homeRiders = Math.min(citizens, riders.get(home.building.id) ?? 0);
    const wanting = citizens - homeRiders;
    transitTotal += homeRiders;
    const brtOnly = isBrtOnly(state, home);
    const walk = walkFrom(walkable, WALKING.enabled ? home.sidewalks : [], maxWalkCost());
    const walkedBefore = tripsTotal(walkingTrips);
    const walkAccess = WALKING.enabled ? walkServices(walk, destinations, citizens, pedestrians, walkingTrips, cyclingTrips, sidewalkLoads, walkArrivals, (site, count, nodes) => trips.push({ from: home.building.id, to: site, mode: 'walk', count, path: tilesOfNodes(nodes) })) : 0;
    const walkedServices = tripsTotal(walkingTrips) - walkedBefore;
    const roadOptions = home.access.length === 0 ? [] : reachableWorkplaces(graph, home, workplaces);
    const roadOptionIds = new Set(roadOptions.map((option) => option.id));
    const walkOptions = WALKING.enabled ? workplaces.flatMap((workplace) => {
      if (roadOptionIds.has(workplace.building.id)) return [];
      const target = nearestTarget(walk, workplace.sidewalks);
      return target !== null && target.cost <= WALKING.workThreshold * WALKING.cyclingFactor ? [{ id: workplace.building.id, path: [], distance: target.cost }] : [];
    }) : [];
    // With more Jobs than Citizens, a workplace reached on foot only must compete by distance, not queue behind every one reached by Road.
    const options = [...roadOptions.map((option) => ({ ...option, distance: option.path.length })), ...walkOptions].sort((a, b) => a.distance - b.distance || a.id - b.id);
    for (const option of options) reachable.add(option.id);
    if (options.length === 0 && brtOnly) {
      const entry = { ...brtOnlyEntry(covered.homes.has(home.building.id)), walkAccess };
      result.set(home.building.id, entry);
      walkTripsByHome.set(home.building.id, walkedServices);
      if (entry.disconnected) brtOnlyDisconnected.push(footprintTiles(home.building));
      continue;
    }
    if (options.length === 0) {
      commutersTotal += wanting;
      result.set(home.building.id, { commuters: wanting, walkers: 0, cyclists: 0, walkAccess, unemployed: 0, ratio: CONGESTION.maxRatio, disconnected: true });
      continue;
    }
    const tiles = new Set<string>();
    let remaining = wanting;
    let walking = 0;
    let cycling = 0;
    for (const option of options) {
      const taken = Math.min(remaining, jobsLeft.get(option.id) ?? 0);
      if (taken <= 0) continue;
      jobsLeft.set(option.id, (jobsLeft.get(option.id) ?? 0) - taken);
      remaining -= taken;
      const target = WALKING.enabled ? nearestTarget(walk, workplaceById.get(option.id)?.sidewalks ?? []) : null;
      if (target !== null && target.cost <= WALKING.workThreshold * WALKING.cyclingFactor) {
        if (target.cost <= WALKING.workThreshold) {
          walking += taken;
          walkArrivals.set(option.id, (walkArrivals.get(option.id) ?? 0) + taken);
        } else cycling += taken;
        const nodes = nodesOnPath(walk, target.node);
        trips.push({ from: home.building.id, to: option.id, mode: target.cost <= WALKING.workThreshold ? 'walk' : 'cycle', count: taken, path: tilesOfNodes(nodes) });
        for (const crossing of crossingsOnPath(walk, target.node)) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + taken);
        for (const node of nodes) sidewalkLoads.set(node, (sidewalkLoads.get(node) ?? 0) + taken);
        continue;
      }
      carArrivals.set(option.id, (carArrivals.get(option.id) ?? 0) + taken);
      trips.push({ from: home.building.id, to: option.id, mode: 'car', count: taken, path: option.path });
      for (const tile of option.path) {
        const key = tileKey(tile);
        loads.set(key, (loads.get(key) ?? 0) + taken);
        tiles.add(key);
      }
    }
    commutersTotal += wanting - remaining - walking - cycling;
    walkersTotal += walking;
    cyclistsTotal += cycling;
    // The Citizens of a BRT-only Home who find no job within walking range ride instead, so they are not unemployed.
    unemployedTotal += brtOnly ? 0 : remaining;
    walkTripsByHome.set(home.building.id, walking + walkedServices);
    used.set(home.building.id, tiles);
    result.set(home.building.id, { commuters: wanting - remaining - walking - cycling, walkers: walking, cyclists: cycling, walkAccess, unemployed: brtOnly ? 0 : remaining, ratio: 0, disconnected: false });
  }

  const touristTrips = touristFlows(state, graph, walkable, covered.activities, now);
  for (const flow of touristTrips) {
    for (const tile of flow.path) loads.set(tileKey(tile), (loads.get(tileKey(tile)) ?? 0) + flow.count);
    for (const crossing of flow.crossings) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + flow.count);
    for (const node of flow.nodes) sidewalkLoads.set(node, (sidewalkLoads.get(node) ?? 0) + flow.count);
  }
  for (const bus of buses) {
    for (const key of busRouteTiles(bus.route)) loads.set(key, (loads.get(key) ?? 0) + BUS_TRAFFIC.load);
  }
  const sections = new Map<string, SectionLoad>();
  for (const [key, load] of loads) {
    const capacity = laneCapacity(tiers.get(key) ?? 1) * (1 - crossingCut(pedestrians.get(key) ?? 0)) * (1 - (closed.get(key) ?? 0));
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
  const relief = congestionReliefOf(state);
  let weighted = 0;
  let population = 0;
  for (const home of homes) {
    const entry = result.get(home.building.id)!;
    if (!entry.disconnected) {
      const worst = Math.max(0, ...[...(used.get(home.building.id) ?? [])].map((key) => sections.get(key)?.ratio ?? 0));
      entry.ratio = Math.min(CONGESTION.maxRatio, worst) * (1 - relief);
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
    cyclists: cyclistsTotal,
    walkingTrips,
    cyclingTrips,
    pedestrians,
    sidewalkLoads,
    carArrivals,
    walkArrivals,
    walkTripsByHome,
    trips,
    touristFlows: touristTrips,
    crossings,
    saturatedCrossings: [...crossings.values()].filter((crossing) => crossing.saturated).length,
    busSpeeds,
    speedFactors: new Map([...busSpeeds].filter(([, speed]) => speed.factor < 1).map(([id, speed]) => [id, speed.factor])),
    slowedLines: [...busSpeeds.values()].filter((speed) => speed.slowed).length,
    modes: { car: commutersTotal, transit: transitTotal, walking: walkersTotal, cycling: cyclistsTotal },
    jobs,
    // A workplace that no Citizen can reach on foot or by Road is staffed by Riders when a station covers it, as a BRT-only one is.
    filledJobs: new Map([...workplaces.map((workplace): [number, number] => {
      const staffedByRiders = !reachable.has(workplace.building.id) && covered.activities.has(workplace.building.id);
      return [workplace.building.id, staffedByRiders ? jobsOf(workplace.building) : jobsOf(workplace.building) - (jobsLeft.get(workplace.building.id) ?? 0)];
    }), ...brtOnlyFilledJobs(state, covered)]),
    unemployed: unemployedTotal,
    shift: NO_SHIFT,
    worstBottleneck: worstSection(sections),
    saturatedSections: [...sections.values()].filter((section) => section.ratio > 1).length,
    disconnectedSections: [...[...brokenComponents].map((id) => components.members.get(id)!), ...brtOnlyDisconnected],
  };
}

function brtOnlyJobs(state: GameState, covered: TransitCoverage): number {
  return state.buildings
    .filter((building) => workplaceTypes.includes(building.type) && hasBrtOnlyAccess(state, building) && covered.activities.has(building.id))
    .reduce((sum, building) => sum + jobsOf(building), 0);
}

// A workplace reached by BRT only has its Jobs filled by Riders, so a covered one counts as fully staffed.
function brtOnlyFilledJobs(state: GameState, covered: TransitCoverage): [number, number][] {
  return state.buildings
    .filter((building) => workplaceTypes.includes(building.type) && hasBrtOnlyAccess(state, building) && covered.activities.has(building.id))
    .map((building) => [building.id, jobsOf(building)]);
}

function isBrtOnly(state: GameState, home: Endpoint): boolean {
  return hasBrtOnlyAccess(state, home.building);
}

function brtOnlyEntry(covered: boolean): HomeCongestion {
  return { commuters: 0, walkers: 0, cyclists: 0, walkAccess: 0, unemployed: 0, ratio: covered ? 0 : CONGESTION.maxRatio, disconnected: !covered };
}

function noCommute(state: GameState, homes: Endpoint[], jobs: number, covered: TransitCoverage, riders: ReadonlyMap<number, number>): CongestionStats {
  const graph = pedestrianGraph(state);
  const destinations = WALKING.enabled ? walkDestinations(state, graph) : [];
  const pedestrians = new Map<string, number>();
  const sidewalkLoads = new Map<string, number>();
  const walkArrivals = new Map<number, number>();
  const walkTripsByHome = new Map<number, number>();
  const trips: TripFlow[] = [];
  const walkingTrips = emptyTrips();
  const cyclingTrips = emptyTrips();
  const entries = homes.map((home): [number, HomeCongestion] => {
    const walk = walkFrom(graph, WALKING.enabled ? home.sidewalks : [], maxWalkCost());
    const walkedBefore = tripsTotal(walkingTrips);
    const walkAccess = WALKING.enabled ? walkServices(walk, destinations, citizensOf(home.building.tier), pedestrians, walkingTrips, cyclingTrips, sidewalkLoads, walkArrivals, (site, count, nodes) => trips.push({ from: home.building.id, to: site, mode: 'walk', count, path: tilesOfNodes(nodes) })) : 0;
    walkTripsByHome.set(home.building.id, tripsTotal(walkingTrips) - walkedBefore);
    if (isBrtOnly(state, home)) return [home.building.id, { ...brtOnlyEntry(covered.homes.has(home.building.id)), walkAccess }];
    return [home.building.id, { commuters: 0, walkers: 0, cyclists: 0, walkAccess, unemployed: 0, ratio: 0, disconnected: false }];
  });
  const stranded = homes.filter((home) => isBrtOnly(state, home) && !covered.homes.has(home.building.id));
  const population = homes.reduce((sum, home) => sum + citizensOf(home.building.tier), 0);
  const transit = homes.reduce((sum, home) => sum + Math.min(citizensOf(home.building.tier), riders.get(home.building.id) ?? 0), 0);
  const weighted = stranded.reduce((sum, home) => sum + citizensOf(home.building.tier) * CONGESTION.maxRatio, 0);
  return {
    sections: new Map(),
    homes: new Map(entries),
    index: population > 0 ? weighted / population : 0,
    commuters: 0,
    walkers: 0,
    cyclists: 0,
    walkingTrips,
    cyclingTrips,
    pedestrians,
    sidewalkLoads,
    carArrivals: new Map(),
    walkArrivals,
    walkTripsByHome,
    trips,
    touristFlows: [],
    crossings: new Map([...pedestrians].map(([key, count]) => {
      const cut = crossingCut(count);
      return [key, { tile: parseTile(key), pedestrians: count, cut, saturated: cut >= WALKING.maxCrossingCut }];
    })),
    saturatedCrossings: [...pedestrians.values()].filter(count => crossingCut(count) >= WALKING.maxCrossingCut).length,
    busSpeeds: new Map(),
    speedFactors: new Map(),
    slowedLines: 0,
    modes: { car: 0, transit, walking: 0, cycling: 0 },
    jobs: jobs,
    filledJobs: new Map(brtOnlyFilledJobs(state, covered)),
    unemployed: 0,
    shift: NO_SHIFT,
    worstBottleneck: null,
    saturatedSections: 0,
    disconnectedSections: stranded.map((home) => footprintTiles(home.building)),
  };
}

function tripsTotal(trips: WalkingTrips): number {
  return Object.values(trips).reduce((sum, count) => sum + count, 0);
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

function endpoints(state: GameState, graph: RoadGraph, walkable: PedestrianGraph, matches: (building: Building) => boolean, sidewalksOf = accessNodes): Endpoint[] {
  return state.buildings
    .filter(matches)
    .sort((a, b) => a.id - b.id)
    .map((building) => ({
      building,
      access: frontTiles(building.type, building.x, building.y, building.rotation, building.tier).filter((tile) => graph.has(tileKey(tile))),
      sidewalks: sidewalksOf(state, walkable, building),
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

// A Sidewalk node reads "x,y:side"; a path lists each tile once in a row.
function tilesOfNodes(nodes: readonly string[]): Coord[] {
  const tiles: Coord[] = [];
  for (const node of nodes) {
    const tile = parseTile(node.split(':')[0]!);
    const last = tiles.at(-1);
    if (last?.x !== tile.x || last.y !== tile.y) tiles.push(tile);
  }
  return tiles;
}

function parseTile(key: string): Coord {
  const [x = 0, y = 0] = key.split(',').map(Number);
  return { x, y };
}
