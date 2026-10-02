import { GAME_CONFIG } from './config';
import type { Coord } from './coord';
import { tileKey } from './geometry';
import type { GameState } from './state';

export function missingRoadTiles(state: GameState, path: Coord[]): Coord[] {
  const existing = new Set(state.roads.map(tileKey));
  return path.filter((tile) => !existing.has(tileKey(tile)));
}

export function roadBuildCost(state: GameState, path: Coord[]): number {
  return missingRoadTiles(state, path).length * GAME_CONFIG.roadCostPerTile;
}
