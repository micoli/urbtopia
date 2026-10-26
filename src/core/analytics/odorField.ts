import { createBuilding } from '../buildings/buildingSpecs';
import type { GameState } from '../engine/state';
import { odorPenaltyOf } from '../waste/wasteNuisance';
import { WASTE_FACILITIES } from '../waste/wasteBalance';
import { buildTileField, type TileField } from './tileField';

const cache = new WeakMap<GameState, TileField>();

// The Odor a Home standing on each tile would bear: the worst Mound around it, never summed.
export function odorField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const field = buildTileField(state, (x, y) => odorPenaltyOf(state, createBuilding(0, 'home', x, y, 0)), WASTE_FACILITIES.mound.odor?.malus ?? 1);
  cache.set(state, field);
  return field;
}
