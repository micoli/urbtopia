import { BUILDING_SPECS, footprintTiles, placementCost } from './buildingSpecs';
import type { Coord } from './coord';
import { frontDirection, neighbour, tileKey } from './geometry';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles } from './occupancy';
import type { BuildingType, GameState, Rotation } from './state';

export type PlacementIssue = 'error.outsideOwnedParcels' | 'error.tilesOccupied' | 'error.needsRoad' | 'error.storehouseExists' | 'error.notEnoughUrbs';

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

export function frontTiles(type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): Coord[] {
  const tiles = footprintTiles({ type, x, y, rotation, tier });
  const inside = new Set(tiles.map(tileKey));
  const front = frontDirection(rotation);
  return tiles.map((tile) => neighbour(tile, front)).filter((tile) => !inside.has(tileKey(tile)));
}

export function frontTouchesRoad(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): boolean {
  return frontTiles(type, x, y, rotation, tier).some((tile) => isRoadLike(state, tile));
}

export function autoRotation(state: GameState, type: BuildingType, x: number, y: number, tier = 1): Rotation {
  if (!BUILDING_SPECS[type].requiresRoad) return 0;
  return ROTATIONS.find((rotation) => frontTouchesRoad(state, type, x, y, rotation, tier)) ?? 0;
}

interface PlacementOptions {
  ignoreBuildingId?: number;
  isMove?: boolean;
  tier?: number;
}

export function placementIssue(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
  rotation: Rotation,
  { ignoreBuildingId, isMove = false, tier = 1 }: PlacementOptions = {},
): PlacementIssue | null {
  const tiles = footprintTiles({ type, x, y, rotation, tier });
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return 'error.outsideOwnedParcels';
  const occupied = occupiedTiles(state, ignoreBuildingId);
  if (tiles.some((tile) => occupied.has(tileKey(tile)))) return 'error.tilesOccupied';
  if (BUILDING_SPECS[type].requiresRoad && !frontTouchesRoad(state, type, x, y, rotation, tier)) return 'error.needsRoad';
  if (isMove) return null;
  if (type === 'storehouse' && state.buildings.some((building) => building.type === 'storehouse')) return 'error.storehouseExists';
  if (state.urbs < placementCost(type)) return 'error.notEnoughUrbs';
  return null;
}
