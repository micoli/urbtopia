import type { GameState } from '../engine/state';
import type { AnalyticsLayerId } from './layers';
import { pollutionField } from './pollutionField';
import type { TileField } from './tileField';

// Layers drawn as a value on every tile; the others are not tile fields.
export function tileFieldOf(state: GameState, layer: AnalyticsLayerId): TileField | null {
  if (layer === 'data.pollution') return pollutionField(state);
  return null;
}
