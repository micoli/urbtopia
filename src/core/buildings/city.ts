import { homePower, economicPower } from '../environment/ecology';
import { energyStats } from '../environment/energy';
import { cropWaterDemand } from '../farming/growth';
import { FACILITIES, isFacilityType } from '../services/facilities';
import { HOME_TIERS, UTILITY_CAPACITY } from '../economy/economy';
import type { GameState } from '../engine/state';
import { isHomeType } from './buildingDefinitions';
import { energySavingOf } from '../politics/ordinanceEffects';

export interface UtilityTotals {
  power: number;
  water: number;
}

export function citizensOf(tier: number): number {
  return HOME_TIERS[tier - 1]?.citizens ?? 0;
}

export function totalCitizens(state: GameState): number {
  return state.buildings.reduce((total, building) => total + (isHomeType(building.type) ? citizensOf(building.tier) : 0), 0);
}

const capacityCache = new WeakMap<GameState, UtilityTotals>();

export function utilityCapacity(state: GameState): UtilityTotals {
  const cached = capacityCache.get(state);
  if (cached) return cached;
  const capacity = computeUtilityCapacity(state);
  capacityCache.set(state, capacity);
  return capacity;
}

function computeUtilityCapacity(state: GameState): UtilityTotals {
  const total = (type: 'powerPlant' | 'waterTower') =>
    state.buildings.reduce((sum, building) => sum + (building.type === type ? (UTILITY_CAPACITY[type][building.tier - 1] ?? 0) : 0), 0);
  const energy = energyStats(state);
  return { power: energy.solar + energy.wind + energy.hydro + energy.geothermal + energy.coal + energy.backup, water: total('waterTower') };
}

const demandCache = new WeakMap<GameState, UtilityTotals>();

export function utilityDemand(state: GameState): UtilityTotals {
  const cached = demandCache.get(state);
  if (cached) return cached;
  const demand = computeUtilityDemand(state);
  demandCache.set(state, demand);
  return demand;
}

function computeUtilityDemand(state: GameState): UtilityTotals {
  const saving = energySavingOf(state);
  const buildings = state.buildings.reduce<UtilityTotals>(
    (total, building) => {
      if (!isHomeType(building.type)) return { power: total.power + economicPower(building, saving), water: total.water + (isFacilityType(building.type) ? FACILITIES[building.type].water : 0) };
      const tier = HOME_TIERS[building.tier - 1];
      return { power: total.power + homePower(building, saving), water: total.water + (tier?.water ?? 0) };
    },
    { power: 0, water: 0 },
  );
  const orchardWater = state.buildings.reduce((total, building) => total + (['oliveTree', 'appleTree', 'cherryTree'].includes(building.type) ? 1 : 0), 0);
  return { power: buildings.power, water: buildings.water + cropWaterDemand(state) + orchardWater };
}
