import { createBuilding } from '../buildings/buildingSpecs';
import { ECOLOGY } from '../environment/ecology';
import { energyStats } from '../environment/energy';
import { wasteKindOf } from '../waste/wasteBalance';
import { pollutionPenaltyOf } from '../environment/wellbeing';
import type { GameState } from '../engine/state';
import { buildTileField, type TileField } from './tileField';

const cache = new WeakMap<GameState, TileField>();

// The Pollution a Home standing on each tile would bear, read with the same function as the Well-being malus.
export function pollutionField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const coalRates = energyStats(state).coalRates;
  const emits = state.buildings.some(building => building.type === 'coalPlant' || wasteKindOf(building.type) === 'incinerator');
  const field = buildTileField(state, (x, y) => !emits ? 0 : pollutionPenaltyOf(state, createBuilding(0, 'home', x, y, 0), coalRates), ECOLOGY.coalWellbeingCap);
  cache.set(state, field);
  return field;
}
