import knowledge from '../../../assets/defs/balance/knowledge.json' with { type: 'json' };
import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import type { Building, GameState } from '../engine/state';
import type { FacilityType } from './facilities';
import { serviceQualityOf } from '../interiors/serviceInterior';
import type { InteriorPart } from '../interiors/interiorStaff';
import { servingFacilitiesOf, servingTiersOf, serviceCoverage, type ServiceCoverage, type ServingTiers } from './services';

export const KNOWLEDGE = knowledge;

const SCHOOLING = Object.entries(KNOWLEDGE.schooling) as [FacilityType, number][];

// Schooling and Library are shares of what is left to learn: only both reach 100.
export function homeKnowledge(state: GameState, home: Building, coverage: ServiceCoverage = serviceCoverage(state), tiers: ServingTiers = servingTiersOf(state)): number {
  const covered = coverage.get(home.id);
  if (!covered) return 0;
  const serving = servingFacilitiesOf(state).get(home.id);
  // The best quality that the interiors of the facilities serving the Home add to the share of Knowledge their type gives.
  const quality = (type: FacilityType, part: InteriorPart): number => Math.max(0, ...(serving?.get(type) ?? []).map(id => {
    const facility = state.buildings.find(candidate => candidate.id === id);
    return facility ? serviceQualityOf(state, facility, part, false) : 0;
  }));
  const schooling = SCHOOLING.reduce((sum, [type, points]) => sum + (covered.has(type) ? points * (1 + (type === 'school' ? quality('school', 'schooling') : 0)) : 0), 0);
  const libraryTier = covered.has('library') ? tiers.get(home.id)?.get('library') ?? 0 : 0;
  const library = Math.min(100, (KNOWLEDGE.library[Math.min(libraryTier, KNOWLEDGE.library.length) - 1] ?? 0) * (1 + quality('library', 'knowledge')));
  return 100 - (100 - Math.min(100, schooling)) * (1 - library / 100);
}

const cityCache = new WeakMap<GameState, number | null>();

// The mean Knowledge of the Homes weighted by Citizens, null in a city without Citizens.
export function cityKnowledge(state: GameState): number | null {
  if (cityCache.has(state)) return cityCache.get(state)!;
  const coverage = serviceCoverage(state);
  const tiers = servingTiersOf(state);
  let weighted = 0;
  let citizens = 0;
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const weight = citizensOf(home.tier);
    weighted += weight * homeKnowledge(state, home, coverage, tiers);
    citizens += weight;
  }
  const result = citizens > 0 ? weighted / citizens : null;
  cityCache.set(state, result);
  return result;
}

// A concave rise: the share of an effect's maximum that a Knowledge from 0 to 100 gives.
export function knowledgeCurve(value: number): number {
  return 1 - (1 - Math.max(0, Math.min(100, value)) / 100) ** KNOWLEDGE.curveExponent;
}

export type KnowledgeEffectId = keyof typeof KNOWLEDGE.effects;

// What the Knowledge of the city currently gives for an effect: its maximum times the curve, nothing in a city without Citizens.
export function knowledgeEffect(state: GameState, effect: KnowledgeEffectId): number {
  const knowledge = cityKnowledge(state);
  return knowledge === null ? 0 : KNOWLEDGE.effects[effect] * knowledgeCurve(knowledge);
}
