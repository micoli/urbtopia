import type { GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { frontTiles } from '../map/placement';
import { accessNodes, crossingsOnPath, nearestTarget, nodesOnPath, walkFrom, type PedestrianGraph } from '../map/pedestrianGraph';
import { neighboursOf, type RoadGraph } from '../map/roadGraph';
import { GAME_CONFIG } from '../engine/config';
import { WALKING, maxWalkCost } from '../traffic/walking';
import { cityAttractiveness } from '../venues/hotel';
import { boostOf, isAttraction } from './tourists';
import { touristsPerDay } from './takings';
import { movingGathering } from './gatheringWindow';

export type TouristMode = 'car' | 'walk' | 'transit';

// Tourists arriving at one Attraction by one mode, along the tiles of their route.
export interface TouristFlow {
  to: number;
  mode: TouristMode;
  count: number;
  path: readonly Coord[];
  // Sidewalk nodes and Crossings of a walk.
  nodes: readonly string[];
  crossings: readonly string[];
}

export const TOURIST_GATES = ['railStation', 'transitHub'] as const;

// The share of an Attraction's Tourists who come through a station when one serves it.
export const STATION_SHARE = 0.6;

const MAP_SIZE = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;

const borderDistance = (tile: Coord): number => Math.min(tile.x, tile.y, MAP_SIZE - 1 - tile.x, MAP_SIZE - 1 - tile.y);

// Where the Tourists who come by road enter the city: the Road tile nearest to the edge of the map.
export function roadGate(graph: RoadGraph): Coord | null {
  let best: { tile: Coord; key: string; distance: number } | null = null;
  for (const key of graph.keys()) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    const tile = { x, y };
    const distance = borderDistance(tile);
    if (best === null || distance < best.distance || (distance === best.distance && key < best.key)) best = { tile, key, distance };
  }
  return best?.tile ?? null;
}

// Every Road tile reachable from `from`, in visiting order, with the tile it was reached from.
function roadTree(graph: RoadGraph, from: Coord): Map<string, string | null> {
  const parents = new Map<string, string | null>([[tileKey(from), null]]);
  for (const key of parents.keys()) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    for (const next of neighboursOf(graph, { x, y })) {
      const nextKey = tileKey(next);
      if (!parents.has(nextKey)) parents.set(nextKey, key);
    }
  }
  return parents;
}

function roadPath(tree: ReadonlyMap<string, string | null>, targets: readonly Coord[]): Coord[] | null {
  const wanted = new Set(targets.map(tileKey));
  for (const key of tree.keys()) {
    if (!wanted.has(key)) continue;
    const path: Coord[] = [];
    for (let step: string | null | undefined = key; step !== null && step !== undefined; step = tree.get(step)) {
      const [x = 0, y = 0] = step.split(',').map(Number);
      path.push({ x, y });
    }
    return path;
  }
  return null;
}

// How the Tourists of every Attraction reach it: on foot from a station within walking range, by public transport when the Attraction is covered, the rest by car from the gate of the city.
export function touristFlows(state: GameState, graph: RoadGraph, walkable: PedestrianGraph, coveredActivities: ReadonlySet<number>, now = state.lastSeen): TouristFlow[] {
  const attractions = state.buildings.filter(isAttraction).sort((a, b) => a.id - b.id);
  if (attractions.length === 0) return [];
  const attractiveness = cityAttractiveness(state);
  const gates = state.buildings.filter(building => (TOURIST_GATES as readonly string[]).includes(building.type));
  const gate = roadGate(graph);
  const tree = gate && roadTree(graph, gate);
  const flows: TouristFlow[] = [];
  for (const attraction of attractions) {
    const gathering = movingGathering(attraction, now);
    const tourists = touristsPerDay(attraction, attractiveness) * boostOf(attraction, now) + (gathering?.tourists ?? 0);
    if (tourists <= 0) continue;
    const sidewalks = accessNodes(state, walkable, attraction);
    if (gathering && gathering.citizens > 0) flows.push({ to: attraction.id, mode: 'walk', count: gathering.citizens, path: [], nodes: sidewalks, crossings: [] });
    const walk = gates.length > 0 ? walkFrom(walkable, sidewalks, maxWalkCost()) : null;
    const near = walk && gates.flatMap(station => {
      const target = nearestTarget(walk, accessNodes(state, walkable, station));
      return target !== null && target.cost <= WALKING.thresholds.culture ? [target] : [];
    }).sort((a, b) => a.cost - b.cost)[0];
    let byCar = tourists;
    if (walk && near) {
      const count = tourists * STATION_SHARE;
      flows.push({ to: attraction.id, mode: 'walk', count, path: [], nodes: nodesOnPath(walk, near.node), crossings: crossingsOnPath(walk, near.node) });
      byCar -= count;
    } else if (coveredActivities.has(attraction.id) && gates.length > 0) {
      const count = tourists * STATION_SHARE;
      flows.push({ to: attraction.id, mode: 'transit', count, path: [], nodes: [], crossings: [] });
      byCar -= count;
    }
    if (byCar <= 0 || tree === null) continue;
    const path = roadPath(tree, frontTiles(attraction.type, attraction.x, attraction.y, attraction.rotation, attraction.tier).filter(tile => graph.has(tileKey(tile))));
    if (path) flows.push({ to: attraction.id, mode: 'car', count: byCar, path, nodes: [], crossings: [] });
  }
  return flows;
}

