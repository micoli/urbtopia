import { GAME_CONFIG } from '../engine/config';
import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { DIRECTIONS, neighbour, tileKey } from '../map/geometry';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles } from '../map/occupancy';
import { roadPath } from '../map/roads';
import { PEDESTRIAN_WAY_COST_FACTOR } from '../map/roadCost';
import { undergroundUnlocked } from './underground';

export const WALKWAY_COST_FACTOR = 2;
export const PEDESTRIAN_ACCESS_COST = 150;

export function walkwayCostPerTile(): number {
  return Math.round(GAME_CONFIG.roadCostPerTile * PEDESTRIAN_WAY_COST_FACTOR * WALKWAY_COST_FACTOR);
}

export function walkwaysOf(state: GameState): readonly Coord[] {
  return state.walkways ?? [];
}

export function pedestrianAccessesOf(state: GameState): readonly Coord[] {
  return state.pedestrianAccesses ?? [];
}

export function missingWalkwayTiles(state: GameState, path: readonly Coord[]): Coord[] {
  const existing = new Set(walkwaysOf(state).map(tileKey));
  return path.filter((tile) => !existing.has(tileKey(tile)));
}

export function walkwayBuildCost(state: GameState, path: readonly Coord[]): number {
  return missingWalkwayTiles(state, path).length * walkwayCostPerTile();
}

// An access is active only while a walkway lies right under it.
export function activeAccesses(state: GameState): Coord[] {
  const walkways = new Set(walkwaysOf(state).map(tileKey));
  return pedestrianAccessesOf(state).filter((tile) => walkways.has(tileKey(tile)));
}

// A stair opens onto a Sidewalk or a Pedestrian way, so it stands against a road, a roundabout, a BRT corridor or a Pedestrian way.
export function touchesWalkingSurface(state: GameState, tile: Coord): boolean {
  const ways = new Set((state.pedestrianWays ?? []).map(tileKey));
  const corridors = new Set((state.brtRoads ?? []).map(tileKey));
  return DIRECTIONS.some((direction) => {
    const next = neighbour(tile, direction);
    return isRoadLike(state, next) || ways.has(tileKey(next)) || corridors.has(tileKey(next));
  });
}

// Walkways lying in no walkway group that an active access reaches.
export function disconnectedWalkways(state: GameState): Coord[] {
  const walkways = walkwaysOf(state);
  const keys = new Map(walkways.map((tile) => [tileKey(tile), tile]));
  const reached = new Set<string>();
  const queue = activeAccesses(state).map(tileKey);
  for (const key of queue) reached.add(key);
  for (let index = 0; index < queue.length; index++) {
    const tile = keys.get(queue[index]!);
    if (!tile) continue;
    for (const direction of DIRECTIONS) {
      const next = tileKey(neighbour(tile, direction));
      if (!keys.has(next) || reached.has(next)) continue;
      reached.add(next);
      queue.push(next);
    }
  }
  return walkways.filter((tile) => !reached.has(tileKey(tile)));
}

export function buildWalkway(state: GameState, from: Coord, to: Coord, horizontalFirst: boolean): CommandOutcome {
  if (!undergroundUnlocked(state)) return { key: 'error.itemLocked' };
  const path = roadPath(from, to, horizontalFirst);
  if (!path.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const missing = missingWalkwayTiles(state, path);
  if (missing.length === 0) return { key: 'error.tilesOccupied' };
  const cost = walkwayBuildCost(state, path);
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return { state: { ...state, urbs: state.urbs - cost, walkways: [...walkwaysOf(state), ...missing] }, events: [] };
}

export function demolishWalkways(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  const targets = new Set(tiles.map(tileKey));
  if (!walkwaysOf(state).some((tile) => targets.has(tileKey(tile)))) return { key: 'error.noWalkwayHere' };
  return { state: { ...state, walkways: walkwaysOf(state).filter((tile) => !targets.has(tileKey(tile))) }, events: [] };
}

export function buildPedestrianAccess(state: GameState, tile: Coord): CommandOutcome {
  if (!undergroundUnlocked(state)) return { key: 'error.itemLocked' };
  if (!Number.isInteger(tile.x) || !Number.isInteger(tile.y)) return { key: 'error.unknownCommand' };
  if (!isInsideOwnedParcels(state, tile)) return { key: 'error.outsideOwnedParcels' };
  if (occupiedTiles(state).has(tileKey(tile))) return { key: 'error.tilesOccupied' };
  if (!touchesWalkingSurface(state, tile)) return { key: 'error.accessNeedsPath' };
  if (state.urbs < PEDESTRIAN_ACCESS_COST) return { key: 'error.notEnoughUrbs' };
  return { state: { ...state, urbs: state.urbs - PEDESTRIAN_ACCESS_COST, pedestrianAccesses: [...pedestrianAccessesOf(state), tile] }, events: [] };
}

export function demolishPedestrianAccess(state: GameState, tile: Coord): CommandOutcome {
  const key = tileKey(tile);
  if (!pedestrianAccessesOf(state).some((access) => tileKey(access) === key)) return { key: 'error.noWalkwayHere' };
  return { state: { ...state, pedestrianAccesses: pedestrianAccessesOf(state).filter((access) => tileKey(access) !== key) }, events: [] };
}
