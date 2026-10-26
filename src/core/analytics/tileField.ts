import { GAME_CONFIG } from '../engine/config';
import type { GameState } from '../engine/state';

export interface TileField {
  readonly size: number;
  readonly values: Float32Array;
  readonly max: number;
  // Tiles with a value of zero are painted too; tiles outside the owned Parcels hold NaN and are not.
  readonly paintsZero?: boolean;
}

export const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;

export function fieldValueAt(field: TileField, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= field.size || y >= field.size) return 0;
  const value = field.values[y * field.size + x]!;
  return Number.isNaN(value) ? 0 : value;
}

export function isPainted(field: TileField, value: number): boolean {
  return field.paintsZero ? !Number.isNaN(value) : value > 0;
}

// The values of the tiles of owned Parcels, zero included; the other tiles are not painted.
export function paintedValues(field: TileField): number[] {
  return Array.from(field.values).filter(value => !Number.isNaN(value));
}

// Writes `value` on every tile within `reach` (Chebyshev) of the source, keeping the highest.
export function splat(grid: Float32Array, x: number, y: number, reach: number, value: number): void {
  for (let ty = Math.max(0, y - reach); ty <= Math.min(MAP_TILES - 1, y + reach); ty++) {
    for (let tx = Math.max(0, x - reach); tx <= Math.min(MAP_TILES - 1, x + reach); tx++) {
      const index = ty * MAP_TILES + tx;
      if (value > grid[index]!) grid[index] = value;
    }
  }
}

// Only the tiles of owned Parcels are read, zero included.
export function buildTileField(state: GameState, valueAt: (x: number, y: number) => number, max: number): TileField {
  const values = new Float32Array(MAP_TILES * MAP_TILES).fill(NaN);
  const side = GAME_CONFIG.parcelSizeInTiles;
  for (const parcel of state.ownedParcels) {
    for (let y = parcel.y * side; y < (parcel.y + 1) * side; y++) {
      for (let x = parcel.x * side; x < (parcel.x + 1) * side; x++) values[y * MAP_TILES + x] = valueAt(x, y);
    }
  }
  return { size: MAP_TILES, values, max, paintsZero: true };
}
