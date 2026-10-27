import { COAL_CAPACITY } from '../economy/economy';
import type { Building, GameState } from '../engine/state';
import { energyStats, factorsAt, generatorCapacity } from './energy';
import { ENERGY_SOURCES, PLANT_TYPES, generatedSourceOf, type EnergySourceId } from './generators';

export { ENERGY_SOURCES, type EnergySourceId };

export interface EnergySource {
  id: EnergySourceId;
  copies: number;
  capacity: number;
  output: number;
}

const isSolarGenerator = (b: Building) => generatedSourceOf(b) === 'solar';

function copiesAndCapacity(state: GameState, id: EnergySourceId): { copies: number; capacity: number } {
  if (id === 'solar') {
    const generators = state.buildings.filter(isSolarGenerator);
    return { copies: generators.length, capacity: generators.reduce((sum, b) => sum + generatorCapacity(b), 0) };
  }
  const plants = state.buildings.filter(b => b.type === PLANT_TYPES[id]);
  if (id === 'coal') return { copies: plants.length, capacity: plants.reduce((sum, b) => sum + (b.coalEnabled !== false ? COAL_CAPACITY[b.tier - 1] ?? 0 : 0), 0) };
  return { copies: plants.length, capacity: plants.reduce((sum, b) => sum + generatorCapacity(b), 0) };
}

export function energySources(state: GameState, energy = energyStats(state)): EnergySource[] {
  return ENERGY_SOURCES.map(id => ({ id, output: energy[id], ...copiesAndCapacity(state, id) }));
}

export function sourceFactors(state: GameState, hoursAhead = 0) {
  return factorsAt(state, state.lastSeen, hoursAhead);
}
