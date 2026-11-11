import { citizensOf } from '../buildings/city';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { footprintTiles } from '../buildings/buildingSpecs';
import { frontAccessModes, frontTiles, hasBrtOnlyAccess } from '../map/placement';
import { accessNodes, crossingsOnPath, nearestTarget, nodesOnPath, tripGraph, walkFrom, workAccessNodes, type PedestrianGraph } from '../map/pedestrianGraph';
import { buildRoadGraph, neighboursOf, type RoadGraph } from '../map/roadGraph';
import { transitNetwork, type RiderAllocation, type TransitNetwork } from '../transit/transport';
import { closedFractionsByTile } from '../water/bridgeOpenings';
import { jobsOf, workplaceTypes } from './jobs';
import { assignJobs, type JobCandidate } from './jobAssignment';
import { CONGESTION, laneCapacity, roadSpeed } from './roadTier';
import { BUS_TRAFFIC, busRouteTiles, busSpeedFactor, type BusRoute, type BusSpeed } from './busTraffic';
import { WALKING, crossingCut, maxWalkCost, walkDestinationOf } from './walking';
import { emptyTrips, walkDestinations, walkServices, type WalkingTrips } from './walkingTrips';
import { isHomeType } from '../buildings/buildingDefinitions';
import { movingGathering } from '../tourism/gatheringWindow';
import { sellsTickets } from '../tourism/tourists';
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
  riders: number;
  walkAccess: number;
  unemployed: number;
  ratio: number;
  disconnected: boolean;
}

export type TripMode = 'car' | 'walk' | 'cycle';

// How the Citizens who fill the Jobs of a workplace get there.
export interface JobModes {
  walking: number;
  cycling: number;
  car: number;
  transit: number;
}

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
  // Every trip from a Home to a workplace by car, on foot or by bicycle, and to a service on foot; the trips of the Riders are in `ridership`.
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
  jobModes: ReadonlyMap<number, JobModes>;
  unemployed: number;
  // The Riders the Commute sent along each itinerary; the lines they ride are `transportStats`.
  riderAllocations: readonly RiderAllocation[];
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
// Several variants of a city can share one Roads array (the dashboard also asks for the city without its Casinos): keep a few layouts per Roads array so they never evict each other.
const LAYOUTS_PER_ROADS = 4;
const layoutCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; pedestrianWays: GameState['pedestrianWays']; byLayout: Map<string, CongestionStats> }>();

export function congestionStats(state: GameState, now = state.lastSeen): CongestionStats {
  const cached = statsCache.get(state);
  if (cached?.now === now) return cached.stats;
  const signature = layoutSignature(state, now);
  const known = layoutCache.get(state.roads);
  const layout = known?.roundabouts === state.roundabouts && known.pedestrianWays === state.pedestrianWays ? known : { roundabouts: state.roundabouts, pedestrianWays: state.pedestrianWays, byLayout: new Map<string, CongestionStats>() };
  const stats = layout.byLayout.get(signature) ?? withCongestionFeedback(state, now);
  layout.byLayout.delete(signature);
  layout.byLayout.set(signature, stats);
  if (layout.byLayout.size > LAYOUTS_PER_ROADS) layout.byLayout.delete(layout.byLayout.keys().next().value!);
  layoutCache.set(state.roads, layout);
  statsCache.set(state, { now, stats });
  return stats;
}

const routeKeys = new WeakMap<readonly Coord[], string>();

function routeKeyOf(route: readonly Coord[]): string {
  let key = routeKeys.get(route);
  if (key === undefined) {
    key = route.map(tileKey).join(';');
    routeKeys.set(route, key);
  }
  return key;
}

function networkSignature(network: TransitNetwork): string {
  const lines = network.services.map((line) => `${line.id}:${line.capacity.toFixed(2)}:${line.speed.toFixed(3)}:${line.headway.toFixed(2)}:${line.active ? 1 : 0}:${line.mode === 'bus' && line.active && line.route ? routeKeyOf(line.route) : ''}`);
  return [...lines, optionsSignature(network.homeOptions)].join('|');
}

const optionSignatures = new WeakMap<TransitNetwork['homeOptions'], string>();

// The Homes' itineraries are shared between the networks of equal layout, so their signature is written once.
function optionsSignature(homeOptions: TransitNetwork['homeOptions']): string {
  let signature = optionSignatures.get(homeOptions);
  if (signature === undefined) {
    signature = [...homeOptions].map(([home, options]) => `${home}=${options.map((option) => `${option.lines.join('.')}${option.bike ? 'b' : ''}@${option.minutes.toFixed(2)}>${option.targets.join('.')}`).join(',')}`).join('|');
    optionSignatures.set(homeOptions, signature);
  }
  return signature;
}

function layoutSignature(state: GameState, now: number): string {
  const network = transitNetwork(state, now);
  const buildings = state.buildings
    .filter((building) => isHomeType(building.type) || workplaceTypes.includes(building.type) || walkDestinationOf(building) !== null || sellsTickets(building) || (TOURIST_GATES as readonly string[]).includes(building.type))
    .map((building) => `${building.id}:${building.type}:${building.x}:${building.y}:${building.rotation}:${building.tier}:${jobsOf(building)}:${sellsTickets(building) ? ticketOf(building) : ''}:${network.coveredActivities.has(building.id) ? 1 : 0}:${frontAccessModes(state, building.type, building.x, building.y, building.rotation, building.tier).join('+')}`);
  const openings = [...closedFractionsByTile(state)].map(([key, fraction]) => `${key}=${fraction.toFixed(3)}`);
  const pedestrianWays = (state.pedestrianWays ?? []).map(tileKey).sort().join(';');
  const gatherings = state.buildings.flatMap((building) => (movingGathering(building, now) ? [`${building.id}`] : [])).join(',');
  return [`relief=${congestionReliefOf(state)}`, `gatherings=${gatherings}`, pedestrianWays, networkSignature(network), ...buildings, ...openings].join('|');
}

function activeBusRoutes(network: TransitNetwork): BusRoute[] {
  return network.services.flatMap((line) => (line.mode === 'bus' && line.active && line.route ? [{ id: line.id, route: line.route }] : []));
}

// A Road section slows the cars on it once its load passes its capacity, down to the speed the maximum ratio allows.
function carSpeedFactors(sections: ReadonlyMap<string, SectionLoad>): ReadonlyMap<string, number> {
  const factors = new Map<string, number>();
  for (const [key, section] of sections) if (section.ratio > 1) factors.set(key, Math.max(1 / CONGESTION.maxRatio, 1 / section.ratio));
  return factors;
}

// Two passes, like the effective speed of the buses: the first at free-flow speed, the second with the speeds that load produced.
function withCongestionFeedback(state: GameState, now: number): CongestionStats {
  const free = transitNetwork(state, now);
  const first = calculateCongestion(state, now, free, activeBusRoutes(free));
  const slowedCars = carSpeedFactors(first.sections);
  if (slowedCars.size === 0 && first.speedFactors.size === 0) return first;
  const network = first.speedFactors.size > 0 ? transitNetwork(state, now, first.speedFactors) : free;
  const second = calculateCongestion(state, now, network, activeBusRoutes(network), slowedCars);
  return { ...second, busSpeeds: first.busSpeeds, speedFactors: first.speedFactors, slowedLines: first.slowedLines };
}

interface CarDetail {
  path: readonly Coord[];
}

interface WalkDetail {
  nodes: readonly string[];
  crossings: readonly string[];
}

type JobDetail = CarDetail | WalkDetail;

function calculateCongestion(state: GameState, now: number, network: TransitNetwork, buses: readonly BusRoute[], carFactors: ReadonlyMap<string, number> = new Map()): CongestionStats {
  const graph = buildRoadGraph(state);
  const tiers = new Map(state.roads.map((road) => [tileKey(road), road.tier ?? 1]));
  const closed = closedFractionsByTile(state);
  const walkable = tripGraph(state);
  const homes = endpoints(state, graph, walkable, (building) => isHomeType(building.type));
  const transitTargets = new Set([...network.homeOptions.values()].flatMap((options) => options.flatMap((option) => option.targets)));
  // A workplace that no Road, Sidewalk or line reaches has no Citizen to fill it, so it offers no Job to the city.
  const workplaces = endpoints(state, graph, walkable, (building) => workplaceTypes.includes(building.type), workAccessNodes).filter((workplace) => workplace.access.length > 0 || workplace.sidewalks.length > 0 || transitTargets.has(workplace.building.id));
  const destinations = WALKING.enabled ? walkDestinations(state, walkable) : [];
  const pedestrians = new Map<string, number>();
  const sidewalkLoads = new Map<string, number>();
  const carArrivals = new Map<number, number>();
  const walkArrivals = new Map<number, number>();
  const walkTripsByHome = new Map<number, number>();
  const trips: TripFlow[] = [];
  const walkingTrips = emptyTrips();
  const cyclingTrips = emptyTrips();
  const jobsById = new Map(workplaces.map((workplace) => [workplace.building.id, jobsOf(workplace.building)]));
  const jobs = [...jobsById.values()].reduce((sum, count) => sum + count, 0);
  if ((graph.size === 0 && walkable.size === 0 && network.homeOptions.size === 0) || workplaces.length === 0 || homes.length === 0) return noCommute(state, homes, jobs, network);

  const components = labelComponents(graph);
  const componentOf = (endpoint: Endpoint) => components.labels.get(tileKey(endpoint.access[0] ?? { x: NaN, y: NaN }));
  const homeComponents = new Set(homes.map(componentOf));
  const workplaceComponents = new Set(workplaces.map(componentOf));
  const brokenComponents = new Set([...components.members.keys()].filter((id) => homeComponents.has(id) !== workplaceComponents.has(id)));

  const loads = new Map<string, number>();
  const used = new Map<number, Set<string>>();
  const roadSearch = roadSearchOf(graph, (key) => 1 / (roadSpeed(tiers.get(key) ?? 1) * (carFactors.get(key) ?? 1)));
  const workplaceNodes = workplaces.map((workplace) => ({ id: workplace.building.id, access: nodesOf(roadSearch, workplace.access) }));
  const walkAccessByHome = new Map<number, number>();
  const walkedServicesByHome = new Map<number, number>();
  const candidates: JobCandidate<JobDetail>[] = [];

  for (const home of homes) {
    const homeId = home.building.id;
    const citizens = citizensOf(home.building.tier);
    const walk = walkFrom(walkable, WALKING.enabled ? home.sidewalks : [], maxWalkCost());
    const walkedBefore = tripsTotal(walkingTrips);
    walkAccessByHome.set(homeId, WALKING.enabled ? walkServices(walk, destinations, citizens, pedestrians, walkingTrips, cyclingTrips, sidewalkLoads, walkArrivals, (site, count, nodes) => trips.push({ from: homeId, to: site, mode: 'walk', count, path: tilesOfNodes(nodes) })) : 0);
    walkedServicesByHome.set(homeId, tripsTotal(walkingTrips) - walkedBefore);
    if (home.access.length > 0) {
      for (const option of reachableWorkplaces(roadSearch, nodesOf(roadSearch, home.access), workplaceNodes)) {
        candidates.push({ home: homeId, workplace: option.id, mode: 'car', minutes: option.minutes, detail: { path: traceBack(roadSearch, option.end) } });
      }
    }
    if (WALKING.enabled) {
      for (const workplace of workplaces) {
        const target = nearestTarget(walk, workplace.sidewalks);
        if (target === null || target.cost > WALKING.workThreshold * WALKING.workCyclingFactor) continue;
        const walking = target.cost <= WALKING.workThreshold;
        candidates.push({ home: homeId, workplace: workplace.building.id, mode: walking ? 'walk' : 'cycle', minutes: walking ? target.cost : target.cost / WALKING.workCyclingFactor, detail: { nodes: nodesOnPath(walk, target.node), crossings: crossingsOnPath(walk, target.node) } });
      }
    }
    for (const option of network.homeOptions.get(homeId) ?? []) {
      for (const workplace of option.targets) if (jobsById.has(workplace)) candidates.push({ home: homeId, workplace, mode: 'transit', minutes: option.minutes, option });
    }
  }

  const citizensByHome = new Map(homes.map((home) => [home.building.id, citizensOf(home.building.tier)]));
  const spare = new Map(network.services.map((line) => [line.id, line.capacity]));
  const { assignments, unemployed } = assignJobs(citizensByHome, jobsById, spare, candidates);

  const perHome = new Map<number, { car: number; walking: number; cycling: number; riders: number }>(homes.map((home) => [home.building.id, { car: 0, walking: 0, cycling: 0, riders: 0 }]));
  const filled = new Map<number, number>(workplaces.map((workplace) => [workplace.building.id, 0]));
  const jobModes = new Map<number, JobModes>(workplaces.map((workplace) => [workplace.building.id, { walking: 0, cycling: 0, car: 0, transit: 0 }]));
  const allocations: RiderAllocation[] = [];
  for (const { candidate, count } of assignments) {
    const share = perHome.get(candidate.home)!;
    filled.set(candidate.workplace, (filled.get(candidate.workplace) ?? 0) + count);
    const modes = jobModes.get(candidate.workplace)!;
    modes[candidate.mode === 'walk' ? 'walking' : candidate.mode === 'cycle' ? 'cycling' : candidate.mode] += count;
    if (candidate.mode === 'transit') {
      share.riders += count;
      allocations.push({ home: candidate.home, workplace: candidate.workplace, option: candidate.option!, count });
    } else if (candidate.mode === 'car') {
      const { path } = candidate.detail as CarDetail;
      const tiles = used.get(candidate.home) ?? new Set<string>();
      share.car += count;
      carArrivals.set(candidate.workplace, (carArrivals.get(candidate.workplace) ?? 0) + count);
      trips.push({ from: candidate.home, to: candidate.workplace, mode: 'car', count, path });
      for (const tile of path) {
        const key = tileKey(tile);
        loads.set(key, (loads.get(key) ?? 0) + count);
        tiles.add(key);
      }
      used.set(candidate.home, tiles);
    } else {
      const { nodes, crossings } = candidate.detail as WalkDetail;
      if (candidate.mode === 'walk') {
        share.walking += count;
        walkArrivals.set(candidate.workplace, (walkArrivals.get(candidate.workplace) ?? 0) + count);
      } else share.cycling += count;
      trips.push({ from: candidate.home, to: candidate.workplace, mode: candidate.mode, count, path: tilesOfNodes(nodes) });
      for (const crossing of crossings) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + count);
      for (const node of nodes) sidewalkLoads.set(node, (sidewalkLoads.get(node) ?? 0) + count);
    }
  }

  let commutersTotal = 0;
  let walkersTotal = 0;
  let cyclistsTotal = 0;
  let transitTotal = 0;
  let unemployedTotal = 0;
  const brtOnlyDisconnected: Coord[][] = [];
  const result = new Map<number, HomeCongestion>();
  for (const home of homes) {
    const homeId = home.building.id;
    const share = perHome.get(homeId)!;
    const walkAccess = walkAccessByHome.get(homeId) ?? 0;
    const reachesSomething = candidates.some((candidate) => candidate.home === homeId);
    walkTripsByHome.set(homeId, share.walking + (walkedServicesByHome.get(homeId) ?? 0));
    if (!reachesSomething && isBrtOnly(state, home)) {
      const entry = { ...brtOnlyEntry(network.homeOptions.has(homeId), citizensOf(home.building.tier)), walkAccess };
      unemployedTotal += entry.unemployed;
      result.set(homeId, entry);
      if (entry.disconnected) brtOnlyDisconnected.push(footprintTiles(home.building));
      continue;
    }
    if (!reachesSomething) {
      commutersTotal += citizensOf(home.building.tier);
      result.set(homeId, { commuters: citizensOf(home.building.tier), walkers: 0, cyclists: 0, riders: 0, walkAccess, unemployed: 0, ratio: CONGESTION.maxRatio, disconnected: true });
      continue;
    }
    const jobless = unemployed.get(homeId) ?? 0;
    commutersTotal += share.car;
    walkersTotal += share.walking;
    cyclistsTotal += share.cycling;
    transitTotal += share.riders;
    unemployedTotal += jobless;
    result.set(homeId, { commuters: share.car, walkers: share.walking, cyclists: share.cycling, riders: share.riders, walkAccess, unemployed: jobless, ratio: 0, disconnected: false });
  }

  const touristTrips = touristFlows(state, graph, walkable, network.coveredActivities, now);
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
    filledJobs: filled,
    jobModes,
    unemployed: unemployedTotal,
    riderAllocations: allocations,
    worstBottleneck: worstSection(sections),
    saturatedSections: [...sections.values()].filter((section) => section.ratio > 1).length,
    disconnectedSections: [...[...brokenComponents].map((id) => components.members.get(id)!), ...brtOnlyDisconnected],
  };
}

function isBrtOnly(state: GameState, home: Endpoint): boolean {
  return hasBrtOnlyAccess(state, home.building);
}

// A BRT-only Home served by a line that reaches no workplace has all its Citizens Unemployed; one the lines do not serve is cut off, which the Congestion already charges.
function brtOnlyEntry(covered: boolean, citizens: number): HomeCongestion {
  return { commuters: 0, walkers: 0, cyclists: 0, riders: 0, walkAccess: 0, unemployed: covered ? citizens : 0, ratio: covered ? 0 : CONGESTION.maxRatio, disconnected: !covered };
}

function noCommute(state: GameState, homes: Endpoint[], jobs: number, network: TransitNetwork): CongestionStats {
  const graph = tripGraph(state);
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
    if (isBrtOnly(state, home)) return [home.building.id, { ...brtOnlyEntry(network.homeOptions.has(home.building.id), 0), walkAccess }];
    return [home.building.id, { commuters: 0, walkers: 0, cyclists: 0, riders: 0, walkAccess, unemployed: 0, ratio: 0, disconnected: false }];
  });
  const stranded = homes.filter((home) => isBrtOnly(state, home) && !network.homeOptions.has(home.building.id));
  const population = homes.reduce((sum, home) => sum + citizensOf(home.building.tier), 0);
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
    modes: { car: 0, transit: 0, walking: 0, cycling: 0 },
    jobs,
    filledJobs: new Map(),
    jobModes: new Map(),
    unemployed: 0,
    riderAllocations: [],
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

// The Road graph with integer nodes: every Home searches it once per calculation, and most Cities have far more Homes than a string-keyed search can afford.
interface RoadSearch {
  nodes: Map<string, number>;
  tiles: Coord[];
  neighbours: number[][];
  parents: Int32Array;
  depths: Int32Array;
  order: Int32Array;
  queue: Int32Array;
  // Minutes a car spends on each tile, and the minutes since the Home's own Road at each tile reached.
  tileMinutes: Float64Array;
  times: Float64Array;
}

const UNVISITED = -1;
const NO_PARENT = -2;

function roadSearchOf(graph: RoadGraph, minutesOf: (key: string) => number): RoadSearch {
  const nodes = new Map<string, number>();
  const tiles: Coord[] = [];
  const nodeOf = (key: string): number => {
    const known = nodes.get(key);
    if (known !== undefined) return known;
    nodes.set(key, tiles.length);
    tiles.push(parseTile(key));
    return tiles.length - 1;
  };
  const neighbours: number[][] = [];
  for (const [key, exits] of graph) neighbours[nodeOf(key)] = exits.map((exit) => nodeOf(tileKey(exit)));
  for (let node = 0; node < tiles.length; node++) neighbours[node] ??= [];
  const size = tiles.length;
  return { nodes, tiles, neighbours, parents: new Int32Array(size), depths: new Int32Array(size), order: new Int32Array(size), queue: new Int32Array(size), tileMinutes: Float64Array.from(tiles, (tile) => minutesOf(tileKey(tile))), times: new Float64Array(size) };
}

function nodesOf(search: RoadSearch, tiles: readonly Coord[]): number[] {
  return tiles.map((tile) => search.nodes.get(tileKey(tile))!);
}

// The search's arrays hold this Home's result until the next call, so `end` must be traced before then.
function reachableWorkplaces(search: RoadSearch, access: readonly number[], workplaces: readonly { id: number; access: readonly number[] }[]): { id: number; minutes: number; end: number }[] {
  const { neighbours, parents, depths, order, queue, tileMinutes, times } = search;
  parents.fill(UNVISITED);
  let queued = 0;
  for (const node of access) {
    if (parents[node] !== UNVISITED) continue;
    parents[node] = NO_PARENT;
    depths[node] = 1;
    times[node] = tileMinutes[node]!;
    order[node] = queued;
    queue[queued++] = node;
  }
  for (let index = 0; index < queued; index++) {
    const node = queue[index]!;
    for (const next of neighbours[node]!) {
      if (parents[next] !== UNVISITED) continue;
      parents[next] = node;
      depths[next] = depths[node]! + 1;
      times[next] = times[node]! + tileMinutes[next]!;
      order[next] = queued;
      queue[queued++] = next;
    }
  }
  const options: { id: number; minutes: number; end: number }[] = [];
  for (const workplace of workplaces) {
    let end = UNVISITED;
    for (const node of workplace.access) {
      if (parents[node] !== UNVISITED && (end === UNVISITED || order[node]! < order[end]!)) end = node;
    }
    if (end !== UNVISITED) options.push({ id: workplace.id, minutes: times[end]!, end });
  }
  return options;
}

function traceBack(search: RoadSearch, end: number): Coord[] {
  const path: Coord[] = [];
  for (let node = end; node !== NO_PARENT; node = search.parents[node]!) path.push(search.tiles[node]!);
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
  const comma = key.indexOf(',');
  return { x: Number(key.slice(0, comma)), y: Number(key.slice(comma + 1)) };
}
