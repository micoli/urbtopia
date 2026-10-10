import { SERVICE_VEHICLE_ENTRIES, frontTiles, hashSeed, isFacilityType, nextRandom, serviceCoverage, tileKey, type Building, type Coord, type FacilityType, type GameState } from '../core';
import { modelFileOf } from '../core/models/modelFiles';
import { neighboursOf, type RoadGraph } from './roadGraph';

export const SERVICE_VEHICLE_MODELS: Readonly<Record<string, string>> = Object.fromEntries(SERVICE_VEHICLE_ENTRIES.map(({ facility, model }) => [facility, modelFileOf(model)]));

export type ServiceVehicleFacility = FacilityType;

export function sendsServiceVehicles(type: string): type is ServiceVehicleFacility {
  return Object.hasOwn(SERVICE_VEHICLE_MODELS, type);
}

export const SERVICE_TRIP_INTERVAL_SECONDS = { min: 30, max: 60 };

export function tripDelaySeconds(seed: string, facilityId: number, tripIndex: number): number {
  const { value } = nextRandom(hashSeed(`${seed}:delay:${facilityId}:${tripIndex}`));
  const { min, max } = SERVICE_TRIP_INTERVAL_SECONDS;
  return min + (max - min) * value;
}

function roadTilesInFront(graph: RoadGraph, building: Building): Coord[] {
  return frontTiles(building.type, building.x, building.y, building.rotation, building.tier).filter((tile) => graph.has(tileKey(tile)));
}

function shortestPath(graph: RoadGraph, starts: Coord[], goals: Coord[]): Coord[] | null {
  const goalKeys = new Set(goals.map(tileKey));
  const previous = new Map<string, Coord | null>(starts.map((tile) => [tileKey(tile), null]));
  const queue = [...starts];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!;
    if (goalKeys.has(tileKey(current))) return pathTo(previous, current);
    for (const next of neighboursOf(graph, current)) {
      if (previous.has(tileKey(next))) continue;
      previous.set(tileKey(next), current);
      queue.push(next);
    }
  }
  return null;
}

function pathTo(previous: ReadonlyMap<string, Coord | null>, end: Coord): Coord[] {
  const path: Coord[] = [];
  for (let tile: Coord | null | undefined = end; tile; tile = previous.get(tileKey(tile))) path.unshift(tile);
  return path;
}

export function planServiceTrip(state: GameState, graphs: readonly RoadGraph[], facility: Building, tripIndex: number): Coord[] | null {
  if (!isFacilityType(facility.type)) return null;
  const coverage = serviceCoverage(state);
  const homes = state.buildings.filter((building) => building.type === 'home' && coverage.get(building.id)?.has(facility.type as never));
  if (!homes.length) return null;
  const first = Math.floor(nextRandom(hashSeed(`${state.seed}:trip:${facility.id}:${tripIndex}`)).value * homes.length);
  for (let offset = 0; offset < homes.length; offset++) {
    const home = homes[(first + offset) % homes.length]!;
    for (const graph of graphs) {
      const starts = roadTilesInFront(graph, facility);
      if (!starts.length) continue;
      const path = shortestPath(graph, starts, roadTilesInFront(graph, home));
      if (!path || path.length < 2) continue;
      return [...path, ...path.slice(0, -1).reverse()];
    }
  }
  return null;
}
