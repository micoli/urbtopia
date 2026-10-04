import { COAL_CAPACITY } from '../economy/economy';
import { cityGreenBenefits, distance, ECOLOGY, greenBenefits } from './ecology';
import { energyStats } from './energy';
import { SERVICES } from '../services/facilities';
import { citizensOf, totalCitizens } from '../buildings/city';
import { coveredServiceUnits, missingServices, serviceCoverage, type ServiceCoverage } from '../services/services';
import { isAdapting } from './adaptation';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import type { Building, GameState } from '../engine/state';

const WELLBEING_LIMIT = 100;

export { isAdapting };

export function wellbeingTaxFactor(wellbeing: number): number {
  return 1 + wellbeing / SERVICES.taxWellbeingDivisor;
}

export function homeBenefits(state: GameState, home: Building, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates, coverage: ServiceCoverage = serviceCoverage(state), poweredCasinos: ReadonlySet<number> = poweredCasinoIds(state)) {
  const green = greenBenefits(state, home);
  const penalty = state.buildings.reduce((sum, b) => {
    if (b.type !== 'coalPlant' || distance(b, home) > ECOLOGY.coalPollutionRadius) return sum;
    const capacity = COAL_CAPACITY[b.tier - 1] ?? 0;
    if (capacity <= 0) return sum;
    return sum + ECOLOGY.coalWellbeingPenalty * (coalRates.get(b.id) ?? 0) / capacity;
  }, 0);
  const pollutionPenalty = Math.min(ECOLOGY.coalWellbeingCap, penalty);
  const retained = (1 - SERVICES.wellbeingBonus / WELLBEING_LIMIT) ** coveredServiceUnits(coverage, home.id) * leisureRetention(state, home, poweredCasinos, WELLBEING_LIMIT);
  const withServices = WELLBEING_LIMIT - (WELLBEING_LIMIT - green.wellbeing) * retained;
  const missing = isAdapting(state) ? 0 : missingServices(coverage, home).length;
  const servicePenalty = Math.min(SERVICES.penaltyCap, missing * SERVICES.missingPenalty);
  return { ...green, wellbeing: withServices - pollutionPenalty - servicePenalty, serviceBonus: withServices - green.wellbeing, pollutionPenalty, servicePenalty };
}

export function cityBenefits(state: GameState, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates) {
  const green = cityGreenBenefits(state);
  const citizens = totalCitizens(state);
  if (!citizens) return { ...green, pollutionPenalty: 0, servicePenalty: 0 };
  const coverage = serviceCoverage(state);
  const poweredCasinos = poweredCasinoIds(state);
  const total = { wellbeing: 0, pollutionPenalty: 0, servicePenalty: 0 };
  for (const home of state.buildings) {
    if (home.type !== 'home') continue;
    const weight = citizensOf(home.tier) / citizens;
    const benefits = homeBenefits(state, home, coalRates, coverage, poweredCasinos);
    total.wellbeing += benefits.wellbeing * weight;
    total.pollutionPenalty += benefits.pollutionPenalty * weight;
    total.servicePenalty += benefits.servicePenalty * weight;
  }
  return { ...green, ...total };
}
