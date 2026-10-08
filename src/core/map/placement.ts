import { BUILDING_SPECS, footprintTiles, placementCost } from '../buildings/buildingSpecs';
import type { AccessMode } from '../buildings/buildingDefinition';
import type { Coord } from './coord';
import { frontDirection, neighbour, tileKey } from './geometry';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles } from './occupancy';
import type { BuildingType, GameState, Rotation } from '../engine/state';

export type PlacementIssue = 'error.outsideOwnedParcels' | 'error.tilesOccupied' | 'error.needsRoad' | 'error.needsRoadOrBrt' | 'error.storehouseExists' | 'error.siloExists' | 'error.vaultExists' | 'error.grainSiloExists' | 'error.noFarm' | 'error.farmExists' | 'error.packhouseExists' | 'error.townHallExists' | 'error.notEnoughUrbs';

const UNIQUE_BUILDING_ERRORS: Partial<Record<BuildingType, PlacementIssue>> = {
  storehouse: 'error.storehouseExists',
  silo: 'error.siloExists',
  vault: 'error.vaultExists',
  grainSilo: 'error.grainSiloExists',
  farm: 'error.farmExists',
  packhouse: 'error.packhouseExists',
  townHall: 'error.townHallExists',
};

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

export function frontTiles(type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): Coord[] {
  const tiles = footprintTiles({ type, x, y, rotation, tier });
  const inside = new Set(tiles.map(tileKey));
  const front = frontDirection(rotation);
  return tiles.map((tile) => neighbour(tile, front)).filter((tile) => !inside.has(tileKey(tile)));
}

const isBrtTile = (state: GameState, tile: Coord) => (state.brtRoads ?? []).some((candidate) => tileKey(candidate) === tileKey(tile));

export function frontAccessModes(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): AccessMode[] {
  const front = frontTiles(type, x, y, rotation, tier);
  return BUILDING_SPECS[type].accessModes.filter((mode) => front.some((tile) => (mode === 'road' ? isRoadLike(state, tile) : isBrtTile(state, tile))));
}

export function frontHasAccess(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): boolean {
  if (type === 'brtStation' || type === 'railStation') {
    const network = (type === 'brtStation' ? state.brtRoads : state.rails) ?? [];
    return frontTiles(type, x, y, rotation, tier).some((tile) => network.some((candidate) => tileKey(candidate) === tileKey(tile)));
  }
  return frontAccessModes(state, type, x, y, rotation, tier).length > 0;
}

export function autoRotation(state: GameState, type: BuildingType, x: number, y: number, tier = 1): Rotation {
  if (!BUILDING_SPECS[type].requiresRoad) return 0;
  const onRoad = ROTATIONS.find((rotation) => frontAccessModes(state, type, x, y, rotation, tier).includes('road'));
  return onRoad ?? ROTATIONS.find((rotation) => frontHasAccess(state, type, x, y, rotation, tier)) ?? 0;
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
  if (BUILDING_SPECS[type].requiresRoad && !frontHasAccess(state, type, x, y, rotation, tier)) return BUILDING_SPECS[type].accessModes.includes('brt') ? 'error.needsRoadOrBrt' : 'error.needsRoad';
  if (isMove) return null;
  const existsError = UNIQUE_BUILDING_ERRORS[type];
  if (existsError && state.buildings.some((building) => building.type === type)) return existsError;
  if (type === 'grainSilo' && !state.buildings.some((building) => building.type === 'farm')) return 'error.noFarm';
  if (state.urbs < placementCost(type)) return 'error.notEnoughUrbs';
  return null;
}
