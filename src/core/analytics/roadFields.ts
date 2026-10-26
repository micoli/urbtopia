import { congestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import type { GameState } from '../engine/state';
import { MAP_TILES, buildTileField, splat, type TileField } from './tileField';

const carsCache = new WeakMap<GameState, TileField>();
const congestionCache = new WeakMap<GameState, TileField>();

function roadField(fill: (values: Float32Array) => void, max: (values: Float32Array) => number): TileField {
  const values = new Float32Array(MAP_TILES * MAP_TILES);
  fill(values);
  return { size: MAP_TILES, values, max: max(values) };
}

const indexOf = (tile: { x: number; y: number }) => tile.y * MAP_TILES + tile.x;
const isOnMap = (tile: { x: number; y: number }) => tile.x >= 0 && tile.y >= 0 && tile.x < MAP_TILES && tile.y < MAP_TILES;

// Commuters (and Bus car equivalents) loading each Road tile; the scale is the busiest tile of the city.
export function carsField(state: GameState): TileField {
  const cached = carsCache.get(state);
  if (cached) return cached;
  const field = roadField(values => {
    for (const section of congestionStats(state).sections.values()) {
      if (isOnMap(section.tile)) values[indexOf(section.tile)] = section.load;
    }
  }, values => Math.max(1, ...values));
  carsCache.set(state, field);
  return field;
}

export const CONGESTION_REACH = 3;

// Load over Lane capacity, in percent, capped at the maximum ratio, read on every owned tile as the worst Road section
// within reach; disconnected sections read at the cap.
export function congestionField(state: GameState): TileField {
  const cached = congestionCache.get(state);
  if (cached) return cached;
  const cap = CONGESTION.maxRatio * 100;
  const stats = congestionStats(state);
  const grid = new Float32Array(MAP_TILES * MAP_TILES);
  for (const section of stats.sections.values()) {
    if (isOnMap(section.tile)) splat(grid, section.tile.x, section.tile.y, CONGESTION_REACH, Math.min(cap, section.ratio * 100));
  }
  for (const tile of stats.disconnectedSections.flat()) {
    if (isOnMap(tile)) splat(grid, tile.x, tile.y, CONGESTION_REACH, cap);
  }
  const field = buildTileField(state, (x, y) => grid[y * MAP_TILES + x]!, cap);
  congestionCache.set(state, field);
  return field;
}
