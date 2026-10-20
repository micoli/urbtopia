import type { ObjectiveMetric } from '../../core';

const PERCENT = 100;

// A city measure as the player reads it: shares as percentages, the rest as whole numbers.
export function formatObjectiveValue(metric: ObjectiveMetric, value: number | null): string {
  if (value === null) return '—';
  if (metric === 'wasteCoverage' || metric === 'greenShare' || metric === 'congestion') return `${Math.round(value * PERCENT)} %`;
  return String(Math.round(value));
}
