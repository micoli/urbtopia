import type { GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { energySavingOf } from '../politics/ordinanceEffects';
import { isAdapting } from './adaptation';
import { economicPower, homePower } from './ecology';
import { energyStats } from './energy';

const EPSILON = 1e-6;

// Buildings that need power and get less than they need. During an Adaptation period a shortage costs nothing, so none is listed.
export function unpoweredBuildingIds(state: GameState, supplied: ReadonlyMap<number, number> = energyStats(state).supplied): ReadonlySet<number> {
  if (isAdapting(state)) return new Set();
  const saving = energySavingOf(state);
  const unpowered = new Set<number>();
  for (const building of state.buildings) {
    const need = isHomeType(building.type) ? homePower(building, saving) : economicPower(building, saving);
    if (need > EPSILON && (supplied.get(building.id) ?? 0) < need - EPSILON) unpowered.add(building.id);
  }
  return unpowered;
}
