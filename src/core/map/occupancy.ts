import { footprintTiles } from '../buildings/buildingSpecs';
import { GAME_CONFIG } from '../engine/config';
import type { Coord } from './coord';
import { DIRECTIONS, DIRECTION_VECTORS, neighbour, tileKey, type Direction } from './geometry';
import type { GameState } from '../engine/state';
import { bridgeRamps, bridgeTiles, isInfrastructureBridge } from '../water/bridgeGeometry';

export function roundaboutTiles(center: Coord): Coord[] {
  const radius = Math.floor(GAME_CONFIG.roundaboutSize / 2);
  const tiles: Coord[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) tiles.push({ x: center.x + dx, y: center.y + dy });
  }
  return tiles;
}

export function occupiedTiles(state: GameState, ignoreBuildingId?: number): Set<string> {
  const occupied = new Set<string>();
  for (const building of state.buildings) {
    if (building.id === ignoreBuildingId) continue;
    for (const tile of footprintTiles(building)) occupied.add(tileKey(tile));
  }
  for (const tile of [...(state.brtRoads ?? []), ...(state.rails ?? [])]) occupied.add(tileKey(tile));
  for (const field of state.fields) occupied.add(tileKey(field));
  for (const water of state.waterTiles ?? []) occupied.add(tileKey(water));
  for (const road of state.roads) occupied.add(tileKey(road));
  for (const tile of state.pedestrianWays ?? []) occupied.add(tileKey(tile));
  for (const bridge of state.bridges ?? []) if (isInfrastructureBridge(bridge)) for (const tile of bridgeTiles(bridge)) occupied.add(tileKey(tile));
  for (const center of state.roundabouts) {
    for (const tile of roundaboutTiles(center)) occupied.add(tileKey(tile));
  }
  return occupied;
}

export function isInsideOwnedParcels(state: GameState, tile: Coord): boolean {
  const size = GAME_CONFIG.parcelSizeInTiles;
  const parcelX = Math.floor(tile.x / size);
  const parcelY = Math.floor(tile.y / size);
  return state.ownedParcels.some((parcel) => parcel.x === parcelX && parcel.y === parcelY);
}

const roadKeysCache = new WeakMap<GameState['roads'], Set<string>>();

function roadKeysOf(state: GameState): Set<string> {
  const cached = roadKeysCache.get(state.roads);
  if (cached) return cached;
  const keys = new Set(state.roads.map(tileKey));
  roadKeysCache.set(state.roads, keys);
  return keys;
}

export function isRoadLike(state: GameState, tile: Coord): boolean {
  if (roadKeysOf(state).has(tileKey(tile))) return true;
  return state.roundabouts.some((center) => roundaboutTiles(center).some((t) => t.x === tile.x && t.y === tile.y));
}

function isRoundaboutExit(state: GameState, tile: Coord, towardTile: Direction): boolean {
  const vector = DIRECTION_VECTORS[towardTile];
  return state.roundabouts.some((center) => tile.x === center.x - vector.x && tile.y === center.y - vector.y);
}

const severedCache = new WeakMap<NonNullable<GameState['bridges']>, Set<string>>();

// A Road Bridge never joins what lies beneath its span: the link between each ramp and the first or last span tile is cut both ways.
function severedLinks(state: GameState): ReadonlySet<string> | null {
  const bridges = state.bridges;
  if (!bridges || bridges.length === 0) return null;
  const cached = severedCache.get(bridges);
  if (cached) return cached;
  const links = new Set<string>();
  for (const bridge of bridges) {
    if (bridge.carrier !== 'road') continue;
    const span = bridgeTiles(bridge);
    const [first, last] = bridgeRamps(bridge);
    for (const [ramp, tile] of [[first!, span[0]!], [last!, span[span.length - 1]!]] as const) {
      links.add(`${tileKey(ramp)}|${tileKey(tile)}`);
      links.add(`${tileKey(tile)}|${tileKey(ramp)}`);
    }
  }
  severedCache.set(bridges, links);
  return links;
}

export function roadExits(state: GameState, tile: Coord): Direction[] {
  const roadKeys = roadKeysOf(state);
  const severed = severedLinks(state);
  return DIRECTIONS.filter((direction) => {
    const next = neighbour(tile, direction);
    if (severed?.has(`${tileKey(tile)}|${tileKey(next)}`)) return false;
    return roadKeys.has(tileKey(next)) || isRoundaboutExit(state, next, direction);
  });
}
