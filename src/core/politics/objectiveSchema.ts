import { z } from 'zod';
import { count, localizedText } from '../economy/itemSchemas.ts';

// The city measure an Objective looks at; the direction of the comparison belongs to the metric.
export const OBJECTIVE_METRICS = ['vitalSatisfaction', 'wasteCoverage', 'congestion', 'greenShare', 'citizens'] as const;

export type ObjectiveMetric = (typeof OBJECTIVE_METRICS)[number];

// Reached at or above the target, except for the metrics reached at or below it.
export const OBJECTIVE_METRICS_AT_MOST: readonly ObjectiveMetric[] = ['congestion'];

const SHARE_METRICS: readonly ObjectiveMetric[] = ['wasteCoverage', 'congestion', 'greenShare'];

export const objectiveSchema = z
  .strictObject({
    $schema: z.string().optional(),
    name: localizedText,
    description: localizedText,
    metric: z.enum(OBJECTIVE_METRICS),
    target: z.number().min(0),
    // Game days the target must be held to earn the Grant.
    holdDays: z.int().min(1),
    // Urbs of the Grant.
    grant: count,
    // Citizens needed in the city before the Objective can be proposed.
    unlockCitizens: count,
  })
  .refine(({ metric, target }) => !SHARE_METRICS.includes(metric) || target <= 1, { path: ['target'], message: 'a share is between 0 and 1' })
  .refine(({ metric, target }) => metric !== 'vitalSatisfaction' || target <= 100, { path: ['target'], message: 'a satisfaction is between 0 and 100' })
  .refine(({ metric, target }) => metric !== 'citizens' || Number.isInteger(target), { path: ['target'], message: 'a number of Citizens is a whole number' })
  .meta({ title: 'Objective', description: 'An Objective the State sets, one file per Objective id in assets/defs/objectives.' });

export type ObjectiveDefinition = z.infer<typeof objectiveSchema>;
