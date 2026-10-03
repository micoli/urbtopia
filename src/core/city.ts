import { homePower, economicPower } from './ecology';
import { energyStats } from './energy';
import { FACILITIES, isFacilityType } from './facilities';
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
  const total = (type: 'powerPlant' | 'waterTower') =>
    state.buildings.reduce((sum, building) => sum + (building.type === type ? (UTILITY_CAPACITY[type][building.tier - 1] ?? 0) : 0), 0);
  const energy = energyStats(state);
  return { power: energy.solar + energy.wind + energy.coal + energy.backup, water: total('waterTower') };
}

export function utilityDemand(state: GameState): UtilityTotals {
  return state.buildings.reduce<UtilityTotals>(
    (total, building) => {
      if (building.type !== 'home') return { power: total.power + economicPower(building), water: total.water + (isFacilityType(building.type) ? FACILITIES[building.type].water : 0) };
      const tier = HOME_TIERS[building.tier - 1];
      return { power: total.power + homePower(building), water: total.water + (tier?.water ?? 0) };
    },
    { power: 0, water: 0 },
  );
}
