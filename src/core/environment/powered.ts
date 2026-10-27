import type { GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { energySavingOf } from '../politics/ordinanceEffects';
import { isAdapting } from './adaptation';
import { economicPower, homePower } from './ecology';
import { energyStats } from './energy';

const EPSILON = 1e-6;
// A shortage is shared out evenly, so a city that is a little short still shows light: only a deep cut goes dark.
export const LIGHT_SUPPLY_SHARE = 0.25;

// Buildings that need power and get less than a quarter of it. During an Adaptation period a shortage costs nothing, so none is listed.
export function unpoweredBuildingIds(state: GameState, supplied: ReadonlyMap<number, number> = energyStats(state).supplied): ReadonlySet<number> {
  if (isAdapting(state)) return new Set();
  const saving = energySavingOf(state);
  const unpowered = new Set<number>();
  for (const building of state.buildings) {
    const need = isHomeType(building.type) ? homePower(building, saving) : economicPower(building, saving);
    if (need > EPSILON && (supplied.get(building.id) ?? 0) < need * LIGHT_SUPPLY_SHARE - EPSILON) unpowered.add(building.id);
  }
  return unpowered;
}
