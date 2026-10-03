import { COAL_CAPACITY } from './economy';
import { cityGreenBenefits, distance, ECOLOGY, greenBenefits } from './ecology';
import { energyStats } from './energy';
import { citizensOf, totalCitizens } from './city';
import type { Building, GameState } from './state';

export function homeBenefits(state: GameState, home: Building, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates) {
  const green = greenBenefits(state, home);
  const penalty = state.buildings.reduce((sum, b) => {
    if (b.type !== 'coalPlant' || distance(b, home) > ECOLOGY.coalPollutionRadius) return sum;
    const capacity = COAL_CAPACITY[b.tier - 1] ?? 0;
    if (capacity <= 0) return sum;
    return sum + ECOLOGY.coalWellbeingPenalty * (coalRates.get(b.id) ?? 0) / capacity;
  }, 0);
  const pollutionPenalty = Math.min(ECOLOGY.coalWellbeingCap, penalty);
  return { ...green, wellbeing: green.wellbeing - pollutionPenalty, pollutionPenalty };
}

export function cityBenefits(state: GameState, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates) {
  const green = cityGreenBenefits(state);
  const citizens = totalCitizens(state);
  if (!citizens) return { ...green, pollutionPenalty: 0 };
  const pollutionPenalty = state.buildings.reduce((sum, home) => {
    if (home.type !== 'home') return sum;
    return sum + homeBenefits(state, home, coalRates).pollutionPenalty * citizensOf(home.tier) / citizens;
  }, 0);
  return { ...green, wellbeing: green.wellbeing - pollutionPenalty, pollutionPenalty };
}
