import { ECOLOGY, greenBenefits } from './ecology';
import type { NeedFactorId } from './needFactors';
import { climateStats } from './climate';
import { energyStats } from './energy';
import { homeBenefits } from './wellbeing';
import { citizensOf, totalCitizens, utilityCapacity, utilityDemand } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import type { ServiceCategory } from '../services/serviceCategories';
import { coveredCategories, serviceCoverage } from '../services/services';
import { congestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import type { GameState } from '../engine/state';

export const NEED_LEVELS = ['vital', 'safety', 'belonging', 'esteem', 'fulfilment'] as const;
export type NeedLevelId = (typeof NEED_LEVELS)[number];

export type { NeedFactorId };

export type NeedEffect = 'supply' | 'wellbeing' | 'tierUpgrade' | 'none';

export type NeedSection = 'eco-energy' | 'eco-water' | 'eco-services' | 'eco-nature' | 'eco-traffic' | 'eco-emissions';

export interface NeedFactor {
  id: NeedFactorId;
  level: NeedLevelId;
  satisfaction: number | null;
  effects: readonly NeedEffect[];
  section: NeedSection | null;
}

export interface NeedLevel {
  id: NeedLevelId;
  satisfaction: number | null;
  fragile: boolean;
  factors: readonly NeedFactor[];
}

export interface NeedsPyramid {
  levels: readonly NeedLevel[];
  bottleneck: NeedFactor | null;
}

export const NEEDS = { fragileBelow: 50, unbearableTemperature: 34 };

type FactorSpec = Pick<NeedFactor, 'id' | 'level' | 'effects' | 'section'>;

const FACTORS: readonly FactorSpec[] = [
  { id: 'electricity', level: 'vital', effects: ['supply'], section: 'eco-energy' },
  { id: 'water', level: 'vital', effects: ['supply'], section: 'eco-water' },
  { id: 'food', level: 'vital', effects: ['none'], section: null },
  { id: 'safety', level: 'safety', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'health', level: 'safety', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'pollution', level: 'safety', effects: ['wellbeing'], section: 'eco-energy' },
  { id: 'congestion', level: 'safety', effects: ['wellbeing'], section: 'eco-traffic' },
  { id: 'climate', level: 'safety', effects: ['none'], section: 'eco-emissions' },
  { id: 'culture', level: 'belonging', effects: ['wellbeing'], section: 'eco-services' },
  { id: 'leisure', level: 'belonging', effects: ['wellbeing'], section: null },
  { id: 'walking', level: 'belonging', effects: ['wellbeing'], section: 'eco-traffic' },
  { id: 'education', level: 'esteem', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'administration', level: 'esteem', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'shops', level: 'esteem', effects: ['none'], section: null },
  { id: 'worship', level: 'fulfilment', effects: ['wellbeing'], section: 'eco-services' },
  { id: 'greenSpaces', level: 'fulfilment', effects: ['wellbeing'], section: 'eco-nature' },
  { id: 'biodiversity', level: 'fulfilment', effects: ['none'], section: 'eco-nature' },
];

const SERVICE_FACTORS: readonly (readonly [NeedFactorId, ServiceCategory])[] = [
  ['safety', 'safety'], ['health', 'health'], ['culture', 'culture'], ['worship', 'worship'], ['education', 'education'], ['administration', 'administration'],
];

function share(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.max(0, Math.min(100, 100 * numerator / denominator)) : 0;
}

function satisfactions(state: GameState): Map<NeedFactorId, number> {
  const result = new Map<NeedFactorId, number>();
  const citizens = totalCitizens(state);
  if (!citizens) return result;
  const energy = energyStats(state);
  const coverage = serviceCoverage(state);
  const poweredCasinos = poweredCasinoIds(state);
  const congestion = congestionStats(state);
  const sums = new Map<NeedFactorId, number>();
  const add = (id: NeedFactorId, value: number, weight: number) => sums.set(id, (sums.get(id) ?? 0) + value * weight);
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const weight = citizensOf(home.tier);
    const benefits = homeBenefits(state, home, energy.coalRates, coverage, poweredCasinos, congestion);
    const covered = coveredCategories(coverage, home.id);
    for (const [factor, category] of SERVICE_FACTORS) add(factor, covered.includes(category) ? 100 : 0, weight);
    add('pollution', 100 - share(benefits.pollutionPenalty, ECOLOGY.coalWellbeingCap), weight);
    add('congestion', 100 - share(benefits.congestionPenalty, CONGESTION.penaltyCap), weight);
    add('leisure', leisureRetention(state, home, poweredCasinos, 100) < 1 ? 100 : 0, weight);
    add('walking', 100 * (congestion.homes.get(home.id)?.walkAccess ?? 0), weight);
    const green = greenBenefits(state, home);
    add('greenSpaces', green.wellbeing, weight);
    add('biodiversity', green.biodiversity, weight);
  }
  for (const [id, sum] of sums) result.set(id, Math.max(0, Math.min(100, sum / citizens)));
  result.set('climate', share(NEEDS.unbearableTemperature - climateStats(state).temperature, NEEDS.unbearableTemperature - ECOLOGY.optimalTemperature));
  result.set('electricity', 100 - share(energy.unmet, energy.demand));
  const water = utilityDemand(state).water;
  result.set('water', water > 0 ? share(utilityCapacity(state).water, water) : 100);
  return result;
}

export function needsPyramid(state: GameState): NeedsPyramid {
  const values = satisfactions(state);
  const factors = FACTORS.map((spec): NeedFactor => ({ ...spec, satisfaction: values.get(spec.id) ?? null }));
  const levels: NeedLevel[] = [];
  for (const id of NEED_LEVELS) {
    const own = factors.filter(factor => factor.level === id);
    const modelled = own.filter(factor => factor.satisfaction !== null);
    const satisfaction = modelled.length ? modelled.reduce((sum, factor) => sum + factor.satisfaction!, 0) / modelled.length : null;
    const fragile = levels.some(level => level.satisfaction !== null && level.satisfaction < NEEDS.fragileBelow);
    levels.push({ id, satisfaction, fragile, factors: own });
  }
  const weakest = factors.filter(factor => factor.satisfaction !== null).sort((a, b) => a.satisfaction! - b.satisfaction!)[0];
  return { levels, bottleneck: weakest && weakest.satisfaction! < 100 ? weakest : null };
}
