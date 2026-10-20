import { COAL_CAPACITY } from '../economy/economy';
import { cityGreenBenefits, distance, ECOLOGY, greenBenefits } from './ecology';
import { energyStats } from './energy';
import { SERVICES } from '../services/facilities';
import { citizensOf, totalCitizens } from '../buildings/city';
import { coveredServiceUnits, missingServices, serviceCoverage, type ServiceCoverage } from '../services/services';
import { isAdapting } from './adaptation';
import { congestionStats, type CongestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import { WALKING } from '../traffic/walking';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import type { Building, GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { solidarityBonus } from '../economy/solidarity';
import { isWasteMissing } from '../waste/waste';
import { greenBeltBonusOf } from '../politics/ordinanceEffects';
import { incineratorPenaltyOf, odorPenaltyOf } from '../waste/wasteNuisance';

const WELLBEING_LIMIT = 100;

export { isAdapting };

export function wellbeingTaxFactor(wellbeing: number): number {
  return 1 + wellbeing / SERVICES.taxWellbeingDivisor;
}

export function congestionPenaltyOf(ratio: number): number {
  if (ratio <= 1) return 0;
  return CONGESTION.penaltyCap * Math.min(1, (ratio - 1) / (CONGESTION.maxRatio - 1));
}

export function homeBenefits(state: GameState, home: Building, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates, coverage: ServiceCoverage = serviceCoverage(state), poweredCasinos: ReadonlySet<number> = poweredCasinoIds(state), congestion: CongestionStats = congestionStats(state)) {
  const green = greenBenefits(state, home);
  const penalty = state.buildings.reduce((sum, b) => {
    if (b.type !== 'coalPlant' || distance(b, home) > ECOLOGY.coalPollutionRadius) return sum;
    const capacity = COAL_CAPACITY[b.tier - 1] ?? 0;
    if (capacity <= 0) return sum;
    return sum + ECOLOGY.coalWellbeingPenalty * (coalRates.get(b.id) ?? 0) / capacity;
  }, 0);
  const pollutionPenalty = Math.min(ECOLOGY.coalWellbeingCap, penalty + incineratorPenaltyOf(state, home));
  const odorPenalty = odorPenaltyOf(state, home);
  const retained = (1 - SERVICES.wellbeingBonus / WELLBEING_LIMIT) ** coveredServiceUnits(coverage, home.id) * leisureRetention(state, home, poweredCasinos, WELLBEING_LIMIT);
  const withServices = WELLBEING_LIMIT - (WELLBEING_LIMIT - green.wellbeing) * retained;
  const missing = isAdapting(state) ? 0 : missingServices(coverage, home).length + (isWasteMissing(state, home.id) ? 1 : 0);
  const servicePenalty = Math.min(SERVICES.penaltyCap, missing * SERVICES.missingPenalty);
  const congestionPenalty = isAdapting(state) ? 0 : congestionPenaltyOf(congestion.homes.get(home.id)?.ratio ?? 0);
  const walkingBonus = Math.max(0, Math.min(WELLBEING_LIMIT - withServices, Math.round(WALKING.wellbeingBonus * (congestion.homes.get(home.id)?.walkAccess ?? 0))));
  const beltBonus = green.wellbeing > 0 ? Math.max(0, Math.min(greenBeltBonusOf(state), WELLBEING_LIMIT - withServices - walkingBonus)) : 0;
  const withoutSolidarity = withServices + walkingBonus + beltBonus - pollutionPenalty - odorPenalty - servicePenalty - congestionPenalty;
  const solidarity = Math.min(solidarityBonus(state), WELLBEING_LIMIT - withoutSolidarity);
  return { ...green, wellbeing: withoutSolidarity + solidarity, serviceBonus: withServices - green.wellbeing, pollutionPenalty, odorPenalty, servicePenalty, congestionPenalty, walkingBonus, solidarityBonus: solidarity };
}

export function cityBenefits(state: GameState, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates) {
  const green = cityGreenBenefits(state);
  const citizens = totalCitizens(state);
  if (!citizens) return { ...green, pollutionPenalty: 0, servicePenalty: 0, congestionPenalty: 0 };
  const coverage = serviceCoverage(state);
  const poweredCasinos = poweredCasinoIds(state);
  const congestion = congestionStats(state);
  const total = { wellbeing: 0, pollutionPenalty: 0, servicePenalty: 0, congestionPenalty: 0 };
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const weight = citizensOf(home.tier) / citizens;
    const benefits = homeBenefits(state, home, coalRates, coverage, poweredCasinos, congestion);
    total.wellbeing += benefits.wellbeing * weight;
    total.pollutionPenalty += benefits.pollutionPenalty * weight;
    total.servicePenalty += benefits.servicePenalty * weight;
    total.congestionPenalty += benefits.congestionPenalty * weight;
  }
  return { ...green, ...total };
}
