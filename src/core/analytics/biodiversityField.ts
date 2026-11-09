import { createBuilding } from '../buildings/buildingSpecs';
import { greenBenefits } from '../environment/ecology';
import type { GameState } from '../engine/state';
import { buildTileField, type TileField } from './tileField';

const BIODIVERSITY_MAX = 100;

const cache = new WeakMap<GameState, TileField>();

// The Biodiversity a Home standing on each tile would enjoy, read with the same function as the Homes' own: the Green spaces in reach, with a bonus when they touch.
export function biodiversityField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const field = buildTileField(state, (x, y) => greenBenefits(state, createBuilding(0, 'home', x, y, 0)).biodiversity, BIODIVERSITY_MAX);
  cache.set(state, field);
  return field;
}
