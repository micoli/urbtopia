import { GAME_CONFIG } from '../engine/config';
import type { GameState } from '../engine/state';

export interface TileField {
  readonly size: number;
  readonly values: Float32Array;
  readonly max: number;
}

export const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;

export function fieldValueAt(field: TileField, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= field.size || y >= field.size) return 0;
  return field.values[y * field.size + x]!;
}

// Only the tiles of owned Parcels are read; everything else stays at zero.
export function buildTileField(state: GameState, valueAt: (x: number, y: number) => number, max: number): TileField {
  const values = new Float32Array(MAP_TILES * MAP_TILES);
  const side = GAME_CONFIG.parcelSizeInTiles;
  for (const parcel of state.ownedParcels) {
    for (let y = parcel.y * side; y < (parcel.y + 1) * side; y++) {
      for (let x = parcel.x * side; x < (parcel.x + 1) * side; x++) values[y * MAP_TILES + x] = valueAt(x, y);
    }
  }
  return { size: MAP_TILES, values, max };
}
