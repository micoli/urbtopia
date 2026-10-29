import { tileKey } from '../map/geometry';
import type { GameState } from '../engine/state';
import { transportStats } from '../transit/transport';
import { MAP_TILES, type TileField } from './tileField';

export type TransitMode = 'bus' | 'brt' | 'rail';

const cache = new WeakMap<GameState, Map<TransitMode, TileField>>();

const isOnMap = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_TILES && y < MAP_TILES;

// The Riders of the lines of a mode on each tile of their route, added up where several lines share a tile; the scale is the busiest tile.
export function transitField(state: GameState, mode: TransitMode): TileField {
  const known = cache.get(state) ?? new Map<TransitMode, TileField>();
  const cached = known.get(mode);
  if (cached) return cached;
  const values = new Float32Array(MAP_TILES * MAP_TILES);
  for (const line of transportStats(state).lines) {
    if (line.mode !== mode || !line.active || !line.route || line.riders <= 0) continue;
    for (const tile of new Map(line.route.map(step => [tileKey(step), step])).values()) {
      if (isOnMap(tile.x, tile.y)) values[tile.y * MAP_TILES + tile.x] = (values[tile.y * MAP_TILES + tile.x] ?? 0) + line.riders;
    }
  }
  const field = { size: MAP_TILES, values, max: Math.max(1, ...values) };
  known.set(mode, field);
  cache.set(state, known);
  return field;
}

// The ids of the stops served by at least one line of the mode.
export function stopsOfMode(state: GameState, mode: TransitMode): ReadonlySet<number> {
  return new Set(transportStats(state).lines.filter(line => line.mode === mode).flatMap(line => line.stops));
}

export function transitModeOf(layer: string): TransitMode | null {
  return layer === 'movement.bus' ? 'bus' : layer === 'movement.brt' ? 'brt' : layer === 'movement.rail' ? 'rail' : null;
}
