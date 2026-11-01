import knowledge from '../../../assets/defs/balance/knowledge.json' with { type: 'json' };
import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import type { Building, GameState } from '../engine/state';
import type { FacilityType } from './facilities';
import { servingTiersOf, serviceCoverage, type ServiceCoverage, type ServingTiers } from './services';

export const KNOWLEDGE = knowledge;

const SCHOOLING = Object.entries(KNOWLEDGE.schooling) as [FacilityType, number][];

// Schooling and Library are shares of what is left to learn: only both reach 100.
export function homeKnowledge(state: GameState, home: Building, coverage: ServiceCoverage = serviceCoverage(state), tiers: ServingTiers = servingTiersOf(state)): number {
  const covered = coverage.get(home.id);
  if (!covered) return 0;
  const schooling = SCHOOLING.reduce((sum, [type, points]) => sum + (covered.has(type) ? points : 0), 0);
  const libraryTier = covered.has('library') ? tiers.get(home.id)?.get('library') ?? 0 : 0;
  const library = KNOWLEDGE.library[Math.min(libraryTier, KNOWLEDGE.library.length) - 1] ?? 0;
  return 100 - (100 - schooling) * (1 - library / 100);
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
