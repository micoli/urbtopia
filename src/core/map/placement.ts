import { BUILDING_SPECS, footprintOf, footprintTiles } from '../buildings/buildingSpecs';
import { buildLimitReached, nextCopyCost } from '../buildings/buildLimit';
import type { AccessMode } from '../buildings/buildingDefinition';
import type { Coord } from './coord';
import { DIRECTIONS, frontDirection, neighbour, tileKey } from './geometry';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles } from './occupancy';
import { touchesWater } from '../water/marina';
import type { BuildingType, GameState, Rotation } from '../engine/state';

export type PlacementIssue = 'error.outsideOwnedParcels' | 'error.tilesOccupied' | 'error.needsRoad' | 'error.needsRoadOrBrt' | 'error.needsAccess' | 'error.needsWater' | 'error.buildingLimitReached' | 'error.noFarm' | 'error.townHallExists' | 'error.notEnoughUrbs';

const UNIQUE_BUILDING_ERRORS: Partial<Record<BuildingType, PlacementIssue>> = {
  townHall: 'error.townHallExists',
};

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

const FRONT_CACHE_LIMIT = 50_000;
const frontCache = new Map<string, readonly Coord[]>();

export function frontTiles(type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): readonly Coord[] {
  const key = `${type}|${x}|${y}|${rotation}|${tier}`;
  const cached = frontCache.get(key);
  if (cached) return cached;
  const tiles = footprintTiles({ type, x, y, rotation, tier });
  const inside = new Set(tiles.map(tileKey));
  const front = frontDirection(rotation);
  const result = tiles.map((tile) => neighbour(tile, front)).filter((tile) => !inside.has(tileKey(tile)));
  if (frontCache.size >= FRONT_CACHE_LIMIT) frontCache.clear();
  frontCache.set(key, result);
  return result;
}

const tileKeySets = new WeakMap<readonly Coord[], Set<string>>();

function tileKeysOf(tiles: readonly Coord[] | undefined): ReadonlySet<string> {
  if (!tiles) return new Set();
  const cached = tileKeySets.get(tiles);
  if (cached) return cached;
  const keys = new Set(tiles.map(tileKey));
  tileKeySets.set(tiles, keys);
  return keys;
}

const isBrtTile = (state: GameState, tile: Coord) => tileKeysOf(state.brtRoads).has(tileKey(tile));
const isRailTile = (state: GameState, tile: Coord) => tileKeysOf(state.rails).has(tileKey(tile));

// Every tile next to the footprint, on all four sides: a Transit hub is reached from any of them.
export function perimeterTiles(type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): Coord[] {
  const tiles = footprintTiles({ type, x, y, rotation, tier });
  const inside = new Set(tiles.map(tileKey));
  const around = new Map<string, Coord>();
  for (const tile of tiles) for (const direction of DIRECTIONS) {
    const next = neighbour(tile, direction);
    if (!inside.has(tileKey(next))) around.set(tileKey(next), next);
  }
  return [...around.values()];
}

const accessTiles = (type: BuildingType, x: number, y: number, rotation: Rotation, tier: number): readonly Coord[] => (
  type === 'transitHub' ? perimeterTiles(type, x, y, rotation, tier) : frontTiles(type, x, y, rotation, tier)
);

export function frontAccessModes(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): AccessMode[] {
  const front = accessTiles(type, x, y, rotation, tier);
  const pedestrianWays = tileKeysOf(state.pedestrianWays);
  return BUILDING_SPECS[type].accessModes.filter((mode) => front.some((tile) => (
    mode === 'road' ? isRoadLike(state, tile) : mode === 'brt' ? isBrtTile(state, tile) : mode === 'rail' ? isRailTile(state, tile) : pedestrianWays.has(tileKey(tile))
  )));
}

// A Transit hub serves no line, and covers no Home, until a Road, a BRT corridor or a Railway touches it.
export function isHubActive(state: GameState, hub: { type: BuildingType; x: number; y: number; rotation: Rotation; tier?: number }): boolean {
  return frontAccessModes(state, hub.type, hub.x, hub.y, hub.rotation, hub.tier).some((mode) => mode !== 'pedestrianWay');
}

export function hasBrtOnlyAccess(state: GameState, building: { type: BuildingType; x: number; y: number; rotation: Rotation; tier?: number }): boolean {
  const modes = frontAccessModes(state, building.type, building.x, building.y, building.rotation, building.tier);
  return modes.includes('brt') && !modes.includes('road') && !modes.includes('pedestrianWay');
}

export function frontHasAccess(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation, tier = 1): boolean {
  if (type === 'brtStation' || type === 'railStation') {
    const network = (type === 'brtStation' ? state.brtRoads : state.rails) ?? [];
    return frontTiles(type, x, y, rotation, tier).some((tile) => network.some((candidate) => tileKey(candidate) === tileKey(tile)));
  }
  return frontAccessModes(state, type, x, y, rotation, tier).length > 0;
}

export function validFronts(state: GameState, type: BuildingType, x: number, y: number, tier = 1): Rotation[] {
  if (!BUILDING_SPECS[type].requiresRoad) return [];
  return ROTATIONS.filter((rotation) => frontHasAccess(state, type, x, y, rotation, tier));
}

export interface Placement {
  x: number;
  y: number;
  rotation: Rotation;
}

// Looks for a spot that fits around the aimed tile: every rotation on the tile itself, then every origin that keeps the tile under the footprint.
export function fittingPlacement(state: GameState, type: BuildingType, tile: Coord, tier = 1, preferred: Rotation | null = null): Placement | null {
  const rotations = preferred === null ? ROTATIONS : [preferred, ...ROTATIONS.filter((rotation) => rotation !== preferred)];
  const fits = ({ x, y, rotation }: Placement) => placementIssue(state, type, x, y, rotation, { isMove: true, tier }) === null;
  const shiftedOrigins = (rotation: Rotation): Placement[] => {
    const { width, depth } = footprintOf(type, rotation, tier);
    const origins: Placement[] = [];
    for (let dy = 0; dy < depth; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (dx !== 0 || dy !== 0) origins.push({ x: tile.x - dx, y: tile.y - dy, rotation });
      }
    }
    return origins.sort((a, b) => Math.abs(tile.x - a.x) + Math.abs(tile.y - a.y) - Math.abs(tile.x - b.x) - Math.abs(tile.y - b.y));
  };
  const onTile = rotations.map((rotation) => ({ x: tile.x, y: tile.y, rotation }));
  return onTile.find(fits) ?? rotations.flatMap(shiftedOrigins).find(fits) ?? null;
}

export function nextFront(fronts: readonly Rotation[], current: Rotation, step: 1 | -1 = 1): Rotation {
  if (fronts.length === 0) return current;
  const index = fronts.indexOf(current);
  if (index !== -1) return fronts[(index + step + fronts.length) % fronts.length] ?? current;
  const ordered = step === 1 ? fronts : [...fronts].reverse();
  const beyond = ordered.find((front) => (step === 1 ? front > current : front < current));
  return beyond ?? ordered[0] ?? current;
}

export function autoRotation(state: GameState, type: BuildingType, x: number, y: number, tier = 1): Rotation {
  if (!BUILDING_SPECS[type].requiresRoad) return 0;
  const onRoad = ROTATIONS.find((rotation) => frontAccessModes(state, type, x, y, rotation, tier).includes('road'));
  const onBrt = ROTATIONS.find((rotation) => frontAccessModes(state, type, x, y, rotation, tier).includes('brt'));
  return onRoad ?? onBrt ?? ROTATIONS.find((rotation) => frontAccessModes(state, type, x, y, rotation, tier).includes('pedestrianWay')) ?? 0;
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
  if (BUILDING_SPECS[type].requiresRoad && !frontHasAccess(state, type, x, y, rotation, tier)) {
    if (BUILDING_SPECS[type].accessModes.includes('pedestrianWay')) return 'error.needsAccess';
    return BUILDING_SPECS[type].accessModes.includes('brt') ? 'error.needsRoadOrBrt' : 'error.needsRoad';
  }
  if ((type === 'marina' || type === 'hydroPlant') && !touchesWater(state, { type, x, y, rotation, tier })) return 'error.needsWater';
  if (isMove) return null;
  const existsError = UNIQUE_BUILDING_ERRORS[type];
  if (existsError && state.buildings.some((building) => building.type === type)) return existsError;
  if (buildLimitReached(state, type)) return 'error.buildingLimitReached';
  if (type === 'grainSilo' && !state.buildings.some((building) => building.type === 'farm')) return 'error.noFarm';
  if (state.urbs < nextCopyCost(state, type)) return 'error.notEnoughUrbs';
  return null;
}
