import { congestionStats } from '../traffic/congestion';
import { WALKING } from '../traffic/walking';
import type { GameState } from '../engine/state';
import { MAP_TILES, type TileField } from './tileField';

const sidewalkCache = new WeakMap<GameState, TileField>();
const crossingCache = new WeakMap<GameState, TileField>();

const isOnMap = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_TILES && y < MAP_TILES;

function tileOfNode(node: string): { x: number; y: number } {
  const [x, y] = node.split(':')[0]!.split(',').map(Number);
  return { x: x!, y: y! };
}

// Walking trips passing along the Sidewalks and Pedestrian ways of each tile, on a scale relative to the busiest tile.
export function sidewalkField(state: GameState): TileField {
  const cached = sidewalkCache.get(state);
  if (cached) return cached;
  const values = new Float32Array(MAP_TILES * MAP_TILES);
  for (const [node, load] of congestionStats(state).sidewalkLoads) {
    const { x, y } = tileOfNode(node);
    if (isOnMap(x, y)) values[y * MAP_TILES + x] = (values[y * MAP_TILES + x] ?? 0) + load;
  }
  const field = { size: MAP_TILES, values, max: Math.max(1, ...values) };
  sidewalkCache.set(state, field);
  return field;
}

// Share of the Crossing's capacity cut that stands for a saturated Crossing, in percent.
export function pedestrianCrossingsField(state: GameState): TileField {
  const cached = crossingCache.get(state);
  if (cached) return cached;
  const values = new Float32Array(MAP_TILES * MAP_TILES);
  for (const crossing of congestionStats(state).crossings.values()) {
    const { x, y } = crossing.tile;
    if (isOnMap(x, y)) values[y * MAP_TILES + x] = Math.min(100, 100 * crossing.cut / WALKING.maxCrossingCut);
  }
  const field = { size: MAP_TILES, values, max: 100 };
  crossingCache.set(state, field);
  return field;
}
