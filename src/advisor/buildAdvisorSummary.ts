import {
  adoptedOrdinances, approvalOf, categoryCoverageRatio, cityBenefits, cityKnowledge, climateStats, congestionStats, difficultyOf, energyStats, isHomeType,
  needsPyramid, nextUnlock, totalCitizens, transportStats, utilityCapacity, utilityDemand, wasteSituation,
  type Cause, type GameState, type NeedLevelId,
} from '../core';
import { SERVICE_CATEGORIES, type ServiceCategory } from '../core/services/serviceCategories';
import type { Language } from '../i18n/prefsStore';
import type { MessageKey } from '../i18n/messages';
import { DEFAULT_CONTEXT_LEVEL, type ContextLevel } from './contextLevel';
import { messageIn } from './messageIn';

type CauseDigest = Pick<Cause, 'key' | 'weight' | 'params'>;

export interface AdvisorSummary {
  citizens: number;
  urbs: number;
  difficulty: string;
  approval: number | null;
  needs: readonly { level: NeedLevelId; satisfaction: number | null }[];
  weakestFactor: string | null;
  homesByTier: Readonly<Record<number, number>>;
  buildings: Readonly<Record<string, number>>;
  power: { demand: number; unmet: number; solar: number; wind: number; hydro: number; geothermal: number; coal: number };
  water: { demand: number; capacity: number };
  climate: { temperature: number; emissions: number };
  waste: { produced: number; processed: number; uncoveredHomes: number } | null;
  traffic: { congestion: number; saturated: number; disconnected: number; commuters: number; riders: number; jobs: number; unemployed: number };
  services: Readonly<Record<ServiceCategory, number>>;
  knowledge: number | null;
  wellbeing: { cooling: number; biodiversity: number; wellbeing: number; pollution: number; services: number; congestion: number };
  nextUnlock: { citizens: number; items: number } | null;
  ordinances: readonly string[];
  causes: readonly CauseDigest[];
}

const MAX_CAUSES = 3;
const MAX_BUILDING_KINDS = 15;

const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function homesByTierOf(state: GameState): Record<number, number> {
  const tiers: Record<number, number> = {};
  for (const building of state.buildings) {
    if (!isHomeType(building.type)) continue;
    tiers[building.tier] = (tiers[building.tier] ?? 0) + 1;
  }
  return tiers;
}

function otherBuildingsOf(state: GameState): Record<string, number> {
  const counts = new Map<string, number>();
  for (const building of state.buildings) {
    if (isHomeType(building.type)) continue;
    counts.set(building.type, (counts.get(building.type) ?? 0) + 1);
  }
  const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MAX_BUILDING_KINDS);
  return Object.fromEntries(top);
}

export function buildAdvisorSummary(state: GameState, causes: readonly Cause[]): AdvisorSummary {
  const approval = approvalOf(state);
  const pyramid = needsPyramid(state);
  const energy = energyStats(state);
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  const climate = climateStats(state);
  const waste = wasteSituation(state);
  const congestion = congestionStats(state);
  const transport = transportStats(state);
  const benefits = cityBenefits(state);
  const unlock = nextUnlock(state);
  return {
    citizens: totalCitizens(state),
    urbs: round(state.urbs),
    difficulty: difficultyOf(state),
    approval: approval === null ? null : round(approval),
    needs: pyramid.levels.map(({ id, satisfaction }) => ({ level: id, satisfaction: satisfaction === null ? null : round(satisfaction) })),
    weakestFactor: pyramid.bottleneck?.id ?? null,
    homesByTier: homesByTierOf(state),
    buildings: otherBuildingsOf(state),
    power: { demand: round(energy.demand), unmet: round(energy.unmet), solar: round(energy.solar), wind: round(energy.wind), hydro: round(energy.hydro), geothermal: round(energy.geothermal), coal: round(energy.coal) },
    water: { demand: round(demand.water), capacity: round(capacity.water) },
    climate: { temperature: round(climate.temperature, 1), emissions: round(climate.emissions) },
    waste: waste.required ? { produced: round(waste.produced), processed: round(waste.processed), uncoveredHomes: waste.uncoveredHomes } : null,
    traffic: {
      congestion: round(congestion.index * 100),
      saturated: congestion.saturatedSections,
      disconnected: congestion.disconnectedSections.length,
      commuters: round(congestion.commuters),
      riders: round(transport.riders),
      jobs: round(congestion.jobs),
      unemployed: round(congestion.unemployed),
    },
    services: Object.fromEntries(SERVICE_CATEGORIES.map((category) => [category, round(categoryCoverageRatio(state, category) * 100)])) as Record<ServiceCategory, number>,
    knowledge: (() => { const knowledge = cityKnowledge(state); return knowledge === null ? null : round(knowledge); })(),
    wellbeing: {
      cooling: round(benefits.cooling), biodiversity: round(benefits.biodiversity), wellbeing: round(benefits.wellbeing),
      pollution: round(benefits.pollutionPenalty), services: round(benefits.servicePenalty), congestion: round(benefits.congestionPenalty),
    },
    nextUnlock: unlock ? { citizens: unlock.citizens, items: unlock.items.length } : null,
    ordinances: adoptedOrdinances(state),
    causes: [...causes].sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key)).slice(0, MAX_CAUSES).map(({ key, weight, params }) => ({ key, weight, params })),
  };
}

// Each line is kept from the context level it first appears at: level 1 is the bare minimum, level 5 everything.
export function summaryToText(summary: AdvisorSummary, language: Language, level: ContextLevel = DEFAULT_CONTEXT_LEVEL): string {
  const label = (key: MessageKey, params: Readonly<Record<string, number | string>> = {}) => messageIn(language, key, params);
  const unknown = label('advisor.summary.unknown');
  const none = label('advisor.summary.none');
  const list = (entries: readonly string[]) => (entries.length === 0 ? none : entries.join(', '));
  const buildingName = (type: string) => {
    const key = `building.${type}` as MessageKey;
    const name = label(key);
    return name === undefined ? type : name;
  };
  const needs = summary.needs.map(({ level, satisfaction }) => `${label(`advisor.level.${level}` as MessageKey)} ${satisfaction ?? unknown}`);
  const services = SERVICE_CATEGORIES.map((category) => `${label(`advisor.category.${category}` as MessageKey)} ${summary.services[category]}`);
  const shownCauses = summary.causes.slice(0, level < 2 ? 1 : summary.causes.length);
  const causes = shownCauses.length === 0
    ? label('advisor.summary.noCauses')
    : shownCauses.map(({ key, params }, index) => `${index + 1}. ${label(key as MessageKey, params)}`).join(' ');
  const { power, water, climate, waste, traffic, wellbeing } = summary;
  const lines: readonly (readonly [ContextLevel, string | null])[] = [
    [1, `${label('advisor.summary.title')}:`],
    [1, label('advisor.summary.city', { citizens: summary.citizens, urbs: summary.urbs, difficulty: summary.difficulty, approval: summary.approval ?? unknown })],
    [1, `${label('advisor.summary.needs')}: ${list(needs)}`],
    [2, summary.weakestFactor ? `${label('advisor.summary.bottleneck')}: ${label(`needs.factor.${summary.weakestFactor}` as MessageKey)}` : null],
    [2, label('advisor.summary.power', power)],
    [2, label('advisor.summary.water', water)],
    [2, waste ? label('advisor.summary.waste', { produced: waste.produced, processed: waste.processed, uncovered: waste.uncoveredHomes }) : null],
    [2, label('advisor.summary.traffic', traffic)],
    [3, `${label('advisor.summary.tiers')}: ${list(Object.entries(summary.homesByTier).map(([tier, count]) => `${tier}: ${count}`))}`],
    [3, `${label('advisor.summary.services')}: ${list(services)}`],
    [3, label('advisor.summary.climate', climate)],
    [3, summary.knowledge === null ? null : label('advisor.summary.knowledge', { knowledge: summary.knowledge })],
    [4, label('advisor.summary.wellbeing', wellbeing)],
    [4, `${label('advisor.summary.buildings')}: ${list(Object.entries(summary.buildings).map(([type, count]) => `${buildingName(type)} ${count}`))}`],
    [4, summary.nextUnlock ? label('advisor.summary.nextUnlock', summary.nextUnlock) : null],
    [5, `${label('advisor.summary.ordinances')}: ${list(summary.ordinances)}`],
    [1, `${label('advisor.summary.causes')}: ${causes}`],
  ];
  return lines.filter((entry): entry is readonly [ContextLevel, string] => entry[0] <= level && entry[1] !== null).map(([, line]) => line).join('\n');
}
