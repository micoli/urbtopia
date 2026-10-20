import { ECOLOGY, greenBenefits } from './ecology';
import { sanctionedFactors } from '../balance/sanctions';
import { difficultyOf } from '../engine/difficulty';
import type { NeedFactorId } from './needFactors';
import { climateStats } from './climate';
import { energyStats } from './energy';
import { homeBenefits } from './wellbeing';
import { citizensOf, totalCitizens, utilityCapacity, utilityDemand } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import type { ServiceCategory } from '../services/serviceCategories';
import { coveredCategories, serviceCoverage, type ServiceCoverage } from '../services/services';
import { congestionStats, type CongestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import type { Building, GameState } from '../engine/state';
import { solidarityBonus } from '../economy/solidarity';
import { isWasteCovered, wasteReport } from '../waste/waste';
import { esteemBonusOf } from '../politics/ordinanceEffects';

export const NEED_LEVELS = ['vital', 'safety', 'belonging', 'esteem', 'fulfilment'] as const;
export type NeedLevelId = (typeof NEED_LEVELS)[number];

export type { NeedFactorId };

export type NeedEffect = 'supply' | 'wellbeing' | 'tierUpgrade' | 'sanction' | 'none';

export type NeedSection = 'eco-energy' | 'eco-water' | 'eco-services' | 'eco-nature' | 'eco-traffic' | 'eco-emissions';

export interface NeedFactor {
  optional?: boolean;
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

type FactorSpec = Pick<NeedFactor, 'id' | 'level' | 'effects' | 'section' | 'optional'>;

const FACTORS: readonly FactorSpec[] = [
  { id: 'electricity', level: 'vital', effects: ['supply'], section: 'eco-energy' },
  { id: 'water', level: 'vital', effects: ['supply'], section: 'eco-water' },
  { id: 'food', level: 'vital', effects: ['none'], section: null },
  { id: 'waste', level: 'vital', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'safety', level: 'safety', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'health', level: 'safety', effects: ['wellbeing', 'tierUpgrade'], section: 'eco-services' },
  { id: 'pollution', level: 'safety', effects: ['wellbeing'], section: 'eco-energy' },
  { id: 'congestion', level: 'safety', effects: ['wellbeing'], section: 'eco-traffic' },
  { id: 'climate', level: 'safety', effects: ['none'], section: 'eco-emissions' },
  { id: 'culture', level: 'belonging', effects: ['wellbeing'], section: 'eco-services' },
  { id: 'leisure', level: 'belonging', effects: ['wellbeing'], section: null },
  { id: 'walking', level: 'belonging', effects: ['wellbeing'], section: 'eco-traffic' },
  { id: 'solidarity', level: 'belonging', effects: ['wellbeing'], section: null, optional: true },
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

export interface NeedsContext {
  energy: ReturnType<typeof energyStats>;
  coverage: ServiceCoverage;
  poweredCasinos: ReadonlySet<number>;
  congestion: CongestionStats;
}

export function needsContext(state: GameState, now = state.lastSeen): NeedsContext {
  const energy = energyStats(state, now);
  return { energy, coverage: serviceCoverage(state), poweredCasinos: poweredCasinoIds(state, energy.supplied), congestion: congestionStats(state, now) };
}

export function homeNeedSatisfactions(state: GameState, home: Building, { energy, coverage, poweredCasinos, congestion }: NeedsContext): Map<NeedFactorId, number> {
  const result = new Map<NeedFactorId, number>();
  const benefits = homeBenefits(state, home, energy.coalRates, coverage, poweredCasinos, congestion);
  const covered = coveredCategories(coverage, home.id);
  for (const [factor, category] of SERVICE_FACTORS) result.set(factor, covered.includes(category) ? 100 : 0);
  const waste = wasteReport(state);
  if (waste.required) result.set('waste', isWasteCovered(waste, home.id) ? 100 : 0);
  result.set('pollution', 100 - share(benefits.pollutionPenalty + benefits.odorPenalty, ECOLOGY.coalWellbeingCap));
  result.set('congestion', 100 - share(benefits.congestionPenalty, CONGESTION.penaltyCap));
  result.set('leisure', leisureRetention(state, home, poweredCasinos, 100) < 1 ? 100 : 0);
  result.set('walking', 100 * (congestion.homes.get(home.id)?.walkAccess ?? 0));
  result.set('solidarity', solidarityBonus(state) > 0 ? 100 : 0);
  const green = greenBenefits(state, home);
  result.set('greenSpaces', green.wellbeing);
  result.set('biodiversity', green.biodiversity);
  return result;
}

export function climateSatisfaction(state: GameState): number {
  return share(NEEDS.unbearableTemperature - climateStats(state).temperature, NEEDS.unbearableTemperature - ECOLOGY.optimalTemperature);
}

export function waterSatisfaction(state: GameState): number {
  const water = utilityDemand(state).water;
  return water > 0 ? share(utilityCapacity(state).water, water) : 100;
}

function satisfactions(state: GameState): Map<NeedFactorId, number> {
  const result = new Map<NeedFactorId, number>();
  const citizens = totalCitizens(state);
  if (!citizens) return result;
  const context = needsContext(state);
  const sums = new Map<NeedFactorId, number>();
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const weight = citizensOf(home.tier);
    for (const [id, value] of homeNeedSatisfactions(state, home, context)) sums.set(id, (sums.get(id) ?? 0) + value * weight);
  }
  for (const [id, sum] of sums) result.set(id, Math.max(0, Math.min(100, sum / citizens)));
  result.set('climate', climateSatisfaction(state));
  result.set('electricity', 100 - share(context.energy.unmet, context.energy.demand));
  result.set('water', waterSatisfaction(state));
  return result;
}

export function needsPyramid(state: GameState): NeedsPyramid {
  const values = satisfactions(state);
  const sanctioned: readonly NeedFactorId[] = sanctionedFactors(difficultyOf(state));
  const factors = FACTORS.map((spec): NeedFactor => ({ ...spec, effects: sanctioned.includes(spec.id) ? [...spec.effects.filter(effect => effect !== 'none'), 'sanction'] : spec.effects, satisfaction: values.get(spec.id) ?? null }));
  const levels: NeedLevel[] = [];
  for (const id of NEED_LEVELS) {
    const own = factors.filter(factor => factor.level === id);
    const modelled = own.filter(factor => !factor.optional && factor.satisfaction !== null);
    const base = modelled.length ? modelled.reduce((sum, factor) => sum + factor.satisfaction!, 0) / modelled.length : null;
    const satisfaction = base === null ? null : Math.min(100, base + (id === 'belonging' ? solidarityBonus(state) : id === 'esteem' ? esteemBonusOf(state) : 0));
    const fragile = levels.some(level => level.satisfaction !== null && level.satisfaction < NEEDS.fragileBelow);
    levels.push({ id, satisfaction, fragile, factors: own });
  }
  const weakest = factors.filter(factor => !factor.optional && factor.satisfaction !== null).sort((a, b) => a.satisfaction! - b.satisfaction!)[0];
  return { levels, bottleneck: weakest && weakest.satisfaction! < 100 ? weakest : null };
}
