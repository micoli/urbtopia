import { footprintTiles } from './buildingSpecs';
import { GAME_CONFIG } from './config';
import type { Coord } from './coord';
import { DIRECTIONS, DIRECTION_VECTORS, neighbour, tileKey, type Direction } from './geometry';
import type { GameState } from './state';

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
  for (const road of state.roads) occupied.add(tileKey(road));
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

export function isRoadLike(state: GameState, tile: Coord): boolean {
  if (state.roads.some((road) => road.x === tile.x && road.y === tile.y)) return true;
  return state.roundabouts.some((center) => roundaboutTiles(center).some((t) => t.x === tile.x && t.y === tile.y));
}

function isRoundaboutExit(state: GameState, tile: Coord, towardTile: Direction): boolean {
  const vector = DIRECTION_VECTORS[towardTile];
  return state.roundabouts.some((center) => tile.x === center.x - vector.x && tile.y === center.y - vector.y);
}

export function roadExits(state: GameState, tile: Coord): Direction[] {
  return DIRECTIONS.filter((direction) => {
    const next = neighbour(tile, direction);
    return state.roads.some((road) => road.x === next.x && road.y === next.y) || isRoundaboutExit(state, next, direction);
  });
}
