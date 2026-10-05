import { citizensOf } from '../buildings/city';
import type { BuildingType, Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { frontTiles } from '../map/placement';
import { buildRoadGraph, neighboursOf, type RoadGraph } from '../map/roadGraph';
import { FACILITY_TYPES } from '../services/facilities';
import { transportStats } from '../transit/transport';
import { CONGESTION, laneCapacity } from './roadTier';

export const workplaceTypes: readonly BuildingType[] = ['workshop', 'factory', 'shop', 'casino', ...FACILITY_TYPES];

export interface SectionLoad {
  tile: Coord;
  load: number;
  capacity: number;
  ratio: number;
}

export interface HomeCongestion {
  commuters: number;
  ratio: number;
  disconnected: boolean;
}

export interface CongestionStats {
  sections: ReadonlyMap<string, SectionLoad>;
  homes: ReadonlyMap<number, HomeCongestion>;
  index: number;
  commuters: number;
  saturatedSections: number;
  disconnectedSections: readonly (readonly Coord[])[];
}

interface Endpoint {
  building: Building;
  access: Coord[];
}

const statsCache = new WeakMap<GameState, { now: number; stats: CongestionStats }>();
const layoutCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; signature: string; stats: CongestionStats }>();

export function congestionStats(state: GameState, now = state.lastSeen): CongestionStats {
  const cached = statsCache.get(state);
  if (cached?.now === now) return cached.stats;
  const signature = layoutSignature(state, now);
  const layout = layoutCache.get(state.roads);
  const stats = layout?.roundabouts === state.roundabouts && layout.signature === signature ? layout.stats : calculateCongestion(state, now);
  layoutCache.set(state.roads, { roundabouts: state.roundabouts, signature, stats });
  statsCache.set(state, { now, stats });
  return stats;
}

function layoutSignature(state: GameState, now: number): string {
  const riders = transportStats(state, now).homeRiders;
  return state.buildings
    .filter((building) => building.type === 'home' || workplaceTypes.includes(building.type))
    .map((building) => `${building.id}:${building.type}:${building.x}:${building.y}:${building.rotation}:${building.tier}:${riders.get(building.id) ?? 0}`)
    .join('|');
}

function calculateCongestion(state: GameState, now: number): CongestionStats {
  const graph = buildRoadGraph(state);
  const tiers = new Map(state.roads.map((road) => [tileKey(road), road.tier ?? 1]));
  const riders = transportStats(state, now).homeRiders;
  const homes = endpoints(state, graph, (building) => building.type === 'home');
  const workplaces = endpoints(state, graph, (building) => workplaceTypes.includes(building.type)).filter((workplace) => workplace.access.length > 0);
  if (graph.size === 0 || workplaces.length === 0 || homes.length === 0) return noCommute(homes);
  const components = labelComponents(graph);
  const componentOf = (endpoint: Endpoint) => components.labels.get(tileKey(endpoint.access[0] ?? { x: NaN, y: NaN }));
  const homeComponents = new Set(homes.map(componentOf));
  const workplaceComponents = new Set(workplaces.map(componentOf));
  const brokenComponents = new Set([...components.members.keys()].filter((id) => homeComponents.has(id) !== workplaceComponents.has(id)));

  const loads = new Map<string, number>();
  const used = new Map<number, Set<string>>();
  const result = new Map<number, HomeCongestion>();
  let commutersTotal = 0;
  for (const home of homes) {
    const citizens = citizensOf(home.building.tier);
    const commuters = Math.max(0, citizens - (riders.get(home.building.id) ?? 0));
    const reachable = home.access.length === 0 ? [] : reachableWorkplaces(graph, home, workplaces);
    commutersTotal += commuters;
    if (reachable.length === 0) {
      result.set(home.building.id, { commuters, ratio: CONGESTION.maxRatio, disconnected: true });
      continue;
    }
    const tiles = new Set<string>();
    const share = commuters / reachable.length;
    for (const path of reachable) {
      for (const tile of path) {
        const key = tileKey(tile);
        loads.set(key, (loads.get(key) ?? 0) + share);
        tiles.add(key);
      }
    }
    used.set(home.building.id, tiles);
    result.set(home.building.id, { commuters, ratio: 0, disconnected: false });
  }

  const sections = new Map<string, SectionLoad>();
  for (const [key, load] of loads) {
    const capacity = laneCapacity(tiers.get(key) ?? 1);
    sections.set(key, { tile: parseTile(key), load, capacity, ratio: load / capacity });
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
    saturatedSections: [...sections.values()].filter((section) => section.ratio > 1).length,
    disconnectedSections: [...brokenComponents].map((id) => components.members.get(id)!),
  };
}

function noCommute(homes: Endpoint[]): CongestionStats {
  return {
    sections: new Map(),
    homes: new Map(homes.map((home) => [home.building.id, { commuters: 0, ratio: 0, disconnected: false }])),
    index: 0,
    commuters: 0,
    saturatedSections: 0,
    disconnectedSections: [],
  };
}

function endpoints(state: GameState, graph: RoadGraph, matches: (building: Building) => boolean): Endpoint[] {
  return state.buildings
    .filter(matches)
    .sort((a, b) => a.id - b.id)
    .map((building) => ({
      building,
      access: frontTiles(building.type, building.x, building.y, building.rotation, building.tier).filter((tile) => graph.has(tileKey(tile))),
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

function reachableWorkplaces(graph: RoadGraph, home: Endpoint, workplaces: Endpoint[]): Coord[][] {
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
  const paths: Coord[][] = [];
  for (const workplace of workplaces) {
    const reached = workplace.access.map(tileKey).filter((key) => parents.has(key)).sort((a, b) => order.get(a)! - order.get(b)!)[0];
    if (reached === undefined) continue;
    paths.push(traceBack(parents, reached));
  }
  return paths;
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
