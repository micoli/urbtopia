import { frontTiles, perimeterTiles, roundaboutTiles, type Building, type Coord, type GameState } from '../../../../core';

export interface MapSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type ConnectionNetwork = 'road' | 'pedestrianWay';

// Where a stop touches another network: the stop, the tile it touches and the network.
export interface MapConnection {
  stop: number;
  network: ConnectionNetwork;
  x: number;
  y: number;
}

export interface MapJunction {
  x: number;
  y: number;
}

const key = (tile: Coord): string => `${tile.x}:${tile.y}`;
const centre = (tile: Coord) => ({ x: tile.x + 0.5, y: tile.y + 0.5 });

function segmentsBetween(tiles: readonly Coord[]): MapSegment[] {
  const present = new Set(tiles.map(key));
  const segments: MapSegment[] = [];
  for (const tile of tiles) for (const next of [{ x: tile.x + 1, y: tile.y }, { x: tile.x, y: tile.y + 1 }]) {
    if (present.has(key(next))) segments.push({ x1: tile.x + 0.5, y1: tile.y + 0.5, x2: next.x + 0.5, y2: next.y + 0.5 });
  }
  return segments;
}

export function roadTiles(state: GameState): Coord[] {
  const tiles = new Map<string, Coord>();
  for (const road of state.roads) tiles.set(key(road), road);
  for (const center of state.roundabouts) for (const tile of roundaboutTiles(center)) tiles.set(key(tile), tile);
  return [...tiles.values()];
}

export const roadSegments = (state: GameState): MapSegment[] => segmentsBetween(roadTiles(state));

export const pedestrianSegments = (state: GameState): MapSegment[] => segmentsBetween(state.pedestrianWays ?? []);

// The tiles around a stop a pedestrian or a vehicle reaches it from: its front for a stop, every side for a Transit hub.
function reachTiles(stop: Building): Coord[] {
  if (stop.type === 'transitHub') return perimeterTiles(stop.type, stop.x, stop.y, stop.rotation, stop.tier);
  return frontTiles(stop.type, stop.x, stop.y, stop.rotation, stop.tier);
}

export function stopConnections(state: GameState, stops: readonly Building[]): MapConnection[] {
  const roads = new Set(roadTiles(state).map(key));
  const ways = new Set((state.pedestrianWays ?? []).map(key));
  const connections: MapConnection[] = [];
  for (const stop of stops) {
    const road = reachTiles(stop).find(tile => roads.has(key(tile)));
    if (road) connections.push({ stop: stop.id, network: 'road', ...centre(road) });
    const way = perimeterTiles(stop.type, stop.x, stop.y, stop.rotation, stop.tier).find(tile => ways.has(key(tile)));
    if (way) connections.push({ stop: stop.id, network: 'pedestrianWay', ...centre(way) });
  }
  return connections;
}

// Where a Pedestrian way ends against a Road: the only place it joins the sidewalks.
export function pedestrianJunctions(state: GameState): MapJunction[] {
  const roads = new Set(roadTiles(state).map(key));
  const ways = state.pedestrianWays ?? [];
  const present = new Set(ways.map(key));
  const neighbours = (tile: Coord): Coord[] => [{ x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y }, { x: tile.x, y: tile.y + 1 }, { x: tile.x, y: tile.y - 1 }];
  return ways
    .filter(tile => neighbours(tile).filter(next => present.has(key(next))).length <= 1 && neighbours(tile).some(next => roads.has(key(next))))
    .map(centre);
}

export function layerBounds(segments: readonly MapSegment[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (segments.length === 0) return null;
  const xs = segments.flatMap(s => [s.x1, s.x2]), ys = segments.flatMap(s => [s.y1, s.y2]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
