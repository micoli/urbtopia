import { HOME_TIERS, UTILITY_CAPACITY } from './economy';
import type { GameState } from './state';

export interface UtilityTotals {
  power: number;
  water: number;
}

export function citizensOf(tier: number): number {
  return HOME_TIERS[tier - 1]?.citizens ?? 0;
}

export function totalCitizens(state: GameState): number {
  return state.buildings.reduce((total, building) => total + (building.type === 'home' ? citizensOf(building.tier) : 0), 0);
}

export function utilityCapacity(state: GameState): UtilityTotals {
  const count = (type: 'powerPlant' | 'waterTower') => state.buildings.filter((building) => building.type === type).length;
  return { power: count('powerPlant') * UTILITY_CAPACITY.powerPlant, water: count('waterTower') * UTILITY_CAPACITY.waterTower };
}

export function utilityDemand(state: GameState): UtilityTotals {
  return state.buildings.reduce<UtilityTotals>(
    (total, building) => {
      if (building.type !== 'home') return total;
      const tier = HOME_TIERS[building.tier - 1];
      return { power: total.power + (tier?.power ?? 0), water: total.water + (tier?.water ?? 0) };
    },
    { power: 0, water: 0 },
  );
}
