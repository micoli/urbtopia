import { gatheringPenaltyOf } from '../tourism/gatheringMalus';
import { COAL_CAPACITY } from '../economy/economy';
import { cityGreenBenefits, distance, ECOLOGY, greenBenefits } from './ecology';
import { energyStats } from './energy';
import { SERVICES } from '../services/facilities';
import { citizensOf, totalCitizens } from '../buildings/city';
import { coveredServiceUnits, missingServices, serviceCoverage, type ServiceCoverage } from '../services/services';
import { isAdapting } from './adaptation';
import { congestionStats, type CongestionStats } from '../traffic/congestion';
import { CONGESTION, UNEMPLOYMENT } from '../traffic/roadTier';
import { WALKING } from '../traffic/walking';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import type { Building, GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { solidarityBonus } from '../economy/solidarity';
import { knowledgeEffect } from '../services/knowledge';
import { isWasteMissing } from '../waste/waste';
import { greenBeltBonusOf } from '../politics/ordinanceEffects';
import { incineratorPenaltyOf, odorPenaltyOf } from '../waste/wasteNuisance';
import { buildingsOfType } from '../buildings/buildingIndex';
import { comfortBonusOf } from '../homes/homeInterior';

const WELLBEING_LIMIT = 100;

export { isAdapting };

export function wellbeingTaxFactor(wellbeing: number): number {
  return 1 + wellbeing / SERVICES.taxWellbeingDivisor;
}

export function congestionPenaltyOf(ratio: number): number {
  if (ratio <= 1) return 0;
  return CONGESTION.penaltyCap * Math.min(1, (ratio - 1) / (CONGESTION.maxRatio - 1));
}

// The Well-being a Home loses to its Unemployed Citizens: none up to the tolerance, then linear to the cap at a Home with no Citizen in work.
export function unemploymentPenaltyOf(unemployedShare: number): number {
  if (unemployedShare <= UNEMPLOYMENT.tolerance) return 0;
  return UNEMPLOYMENT.maxPenalty * Math.min(1, (unemployedShare - UNEMPLOYMENT.tolerance) / (1 - UNEMPLOYMENT.tolerance));
}

function unemployedShareOf(home: Building, congestion: CongestionStats): number {
  const citizens = citizensOf(home.tier);
  return citizens > 0 ? (congestion.homes.get(home.id)?.unemployed ?? 0) / citizens : 0;
}

interface HomeBenefitsEntry {
  coalRates: ReadonlyMap<number, number>;
  coverage: ServiceCoverage;
  poweredCasinos: ReadonlySet<number>;
  congestion: CongestionStats;
  result: ReturnType<typeof computeHomeBenefits>;
}

const homeBenefitsCache = new WeakMap<GameState, WeakMap<Building, HomeBenefitsEntry>>();

export function homeBenefits(state: GameState, home: Building, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates, coverage: ServiceCoverage = serviceCoverage(state), poweredCasinos: ReadonlySet<number> = poweredCasinoIds(state), congestion: CongestionStats = congestionStats(state)): ReturnType<typeof computeHomeBenefits> {
  const perHome = homeBenefitsCache.get(state) ?? new WeakMap<Building, HomeBenefitsEntry>();
  homeBenefitsCache.set(state, perHome);
  const cached = perHome.get(home);
  if (cached?.coalRates === coalRates && cached.coverage === coverage && cached.poweredCasinos === poweredCasinos && cached.congestion === congestion) return cached.result;
  const result = computeHomeBenefits(state, home, coalRates, coverage, poweredCasinos, congestion);
  perHome.set(home, { coalRates, coverage, poweredCasinos, congestion, result });
  return result;
}

// Coal plants and Incinerators add up, up to a cap.
export function pollutionPenaltyOf(state: GameState, home: Building, coalRates: ReadonlyMap<number, number>): number {
  const penalty = buildingsOfType(state.buildings, 'coalPlant').reduce((sum, b) => {
    if (distance(b, home) > ECOLOGY.coalPollutionRadius) return sum;
    const capacity = COAL_CAPACITY[b.tier - 1] ?? 0;
    if (capacity <= 0) return sum;
    return sum + ECOLOGY.coalWellbeingPenalty * (coalRates.get(b.id) ?? 0) / capacity;
  }, 0);
  return Math.min(ECOLOGY.coalWellbeingCap, penalty + incineratorPenaltyOf(state, home));
}

function computeHomeBenefits(state: GameState, home: Building, coalRates: ReadonlyMap<number, number>, coverage: ServiceCoverage, poweredCasinos: ReadonlySet<number>, congestion: CongestionStats) {
  const green = greenBenefits(state, home);
  const pollutionPenalty = pollutionPenaltyOf(state, home, coalRates);
  const odorPenalty = odorPenaltyOf(state, home);
  const retained = (1 - SERVICES.wellbeingBonus / WELLBEING_LIMIT) ** coveredServiceUnits(coverage, home.id) * leisureRetention(state, home, poweredCasinos, WELLBEING_LIMIT);
  const withServices = WELLBEING_LIMIT - (WELLBEING_LIMIT - green.wellbeing) * retained;
  const missing = isAdapting(state) ? 0 : missingServices(coverage, home).length + (isWasteMissing(state, home.id) ? 1 : 0);
  const servicePenalty = Math.min(SERVICES.penaltyCap, missing * SERVICES.missingPenalty);
  const congestionPenalty = isAdapting(state) ? 0 : congestionPenaltyOf(congestion.homes.get(home.id)?.ratio ?? 0);
  const gatheringPenalty = isAdapting(state) ? 0 : gatheringPenaltyOf(state, home, congestion);
  const unemploymentPenalty = isAdapting(state) ? 0 : unemploymentPenaltyOf(unemployedShareOf(home, congestion));
  const walkingBonus = Math.max(0, Math.min(WELLBEING_LIMIT - withServices, Math.round(WALKING.wellbeingBonus * (congestion.homes.get(home.id)?.walkAccess ?? 0))));
  const beltBonus = green.wellbeing > 0 ? Math.max(0, Math.min(greenBeltBonusOf(state), WELLBEING_LIMIT - withServices - walkingBonus)) : 0;
  const knowledgeBonus = Math.max(0, Math.min(knowledgeEffect(state, 'wellbeing'), WELLBEING_LIMIT - withServices - walkingBonus - beltBonus));
  const comfortBonus = Math.max(0, Math.min(comfortBonusOf(home), WELLBEING_LIMIT - withServices - walkingBonus - beltBonus - knowledgeBonus));
  const withoutSolidarity = withServices + walkingBonus + beltBonus + knowledgeBonus + comfortBonus - pollutionPenalty - odorPenalty - servicePenalty - congestionPenalty - gatheringPenalty - unemploymentPenalty;
  const solidarity = Math.min(solidarityBonus(state), WELLBEING_LIMIT - withoutSolidarity);
  return { ...green, wellbeing: withoutSolidarity + solidarity, serviceBonus: withServices - green.wellbeing, pollutionPenalty, odorPenalty, servicePenalty, congestionPenalty, gatheringPenalty, unemploymentPenalty, walkingBonus, knowledgeBonus, comfortBonus, solidarityBonus: solidarity };
}

export function cityBenefits(state: GameState, coalRates: ReadonlyMap<number, number> = energyStats(state).coalRates) {
  const green = cityGreenBenefits(state);
  const citizens = totalCitizens(state);
  if (!citizens) return { ...green, pollutionPenalty: 0, servicePenalty: 0, congestionPenalty: 0, unemploymentPenalty: 0 };
  const coverage = serviceCoverage(state);
  const poweredCasinos = poweredCasinoIds(state);
  const congestion = congestionStats(state);
  const total = { wellbeing: 0, pollutionPenalty: 0, servicePenalty: 0, congestionPenalty: 0, unemploymentPenalty: 0 };
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const weight = citizensOf(home.tier) / citizens;
    const benefits = homeBenefits(state, home, coalRates, coverage, poweredCasinos, congestion);
    total.wellbeing += benefits.wellbeing * weight;
    total.pollutionPenalty += benefits.pollutionPenalty * weight;
    total.servicePenalty += benefits.servicePenalty * weight;
    total.congestionPenalty += benefits.congestionPenalty * weight;
    total.unemploymentPenalty += benefits.unemploymentPenalty * weight;
  }
  return { ...green, ...total };
}
