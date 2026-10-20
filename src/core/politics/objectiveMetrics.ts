import { citizensOf, totalCitizens } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import type { GameState } from '../engine/state';
import { citizenCount, cityGreenBenefits } from '../environment/ecology';
import { needsPyramid } from '../environment/needs';
import { congestionStats } from '../traffic/congestion';
import { isWasteCovered, wasteReport } from '../waste/waste';
import { OBJECTIVE_METRICS_AT_MOST, type ObjectiveMetric } from './objectiveSchema';
import { objectiveById, type ObjectiveId } from './objectives';

const wasteCoverage = (state: GameState): number | null => {
  const citizens = totalCitizens(state);
  if (citizens === 0) return null;
  const report = wasteReport(state);
  const covered = state.buildings.reduce((sum, home) => sum + (isHomeType(home.type) && isWasteCovered(report, home.id) ? citizensOf(home.tier) : 0), 0);
  return covered / citizens;
};

const greenShare = (state: GameState): number | null => {
  const citizens = citizenCount(state);
  return citizens === 0 ? null : cityGreenBenefits(state).covered / citizens;
};

// The current value of a city measure, null while the city has no Citizens to measure it on.
export function objectiveValue(state: GameState, metric: ObjectiveMetric): number | null {
  switch (metric) {
    case 'citizens': return totalCitizens(state);
    case 'vitalSatisfaction': return needsPyramid(state).levels.find(level => level.id === 'vital')?.satisfaction ?? null;
    case 'wasteCoverage': return wasteCoverage(state);
    case 'congestion': return totalCitizens(state) === 0 ? null : congestionStats(state).index;
    case 'greenShare': return greenShare(state);
  }
}

export function isObjectiveMet(state: GameState, id: ObjectiveId): boolean {
  const { metric, target } = objectiveById(id);
  const value = objectiveValue(state, metric);
  if (value === null) return false;
  return OBJECTIVE_METRICS_AT_MOST.includes(metric) ? value <= target : value >= target;
}
