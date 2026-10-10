import { TRAFFIC_VEHICLE_ENTRIES } from '../core';
import { modelFileOf } from '../core/models/modelFiles';

export const VEHICLE_MODELS: readonly string[] = TRAFFIC_VEHICLE_ENTRIES.map(({ model }) => modelFileOf(model));

export const VEHICLE_CUMULATIVE_WEIGHTS: readonly number[] = TRAFFIC_VEHICLE_ENTRIES.reduce<number[]>((sums, { weight }) => [...sums, (sums.at(-1) ?? 0) + weight], []);
