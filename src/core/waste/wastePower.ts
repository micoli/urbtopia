import { ECOLOGY, economicPower } from '../environment/ecology';
import { isAdapting } from '../environment/adaptation';
import { energyStats } from '../environment/energy';
import type { GameState } from '../engine/state';
import { energySavingOf } from '../politics/ordinanceEffects';

const POWER_EPSILON = 1e-9;

// Share of its power Demand each Recycling plant receives; an Adaptation period exempts shedding.
export function recyclingPlantPowerRatios(state: GameState): ReadonlyMap<number, number> {
  const plants = state.buildings.filter(building => building.type === 'recyclingPlant');
  if (plants.length === 0) return new Map();
  if (isAdapting(state)) return new Map(plants.map(plant => [plant.id, 1]));
  const { supplied } = energyStats(state);
  return new Map(plants.map(plant => {
    const demand = economicPower(plant, energySavingOf(state));
    if (demand <= 0) return [plant.id, 1];
    const ratio = Math.min(1, (supplied.get(plant.id) ?? 0) / demand);
    return [plant.id, ratio <= POWER_EPSILON ? 0 : ratio];
  }));
}

export function hourOf(state: GameState): number {
  return Math.floor((state.lastSeen + (state.timeOffset ?? 0)) / ECOLOGY.hourMs);
}
