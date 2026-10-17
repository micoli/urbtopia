import { GAME_CONFIG } from '../engine/config';
import type { Coord } from './coord';
import { tileKey } from './geometry';
import type { GameState } from '../engine/state';

export const PEDESTRIAN_WAY_COST_FACTOR = 0.9;

export function missingRoadTiles(state: GameState, path: Coord[]): Coord[] {
  const existing = new Set(state.roads.map(tileKey));
  return path.filter((tile) => !existing.has(tileKey(tile)));
}

export function roadBuildCost(state: GameState, path: Coord[]): number {
  return missingRoadTiles(state, path).length * GAME_CONFIG.roadCostPerTile;
}

export function pedestrianWayBuildCost(state: GameState, path: Coord[]): number {
  const existing = new Set((state.pedestrianWays ?? []).map(tileKey));
  const missing = path.filter((tile) => !existing.has(tileKey(tile)));
  return missing.length * Math.round(GAME_CONFIG.roadCostPerTile * PEDESTRIAN_WAY_COST_FACTOR);
}
