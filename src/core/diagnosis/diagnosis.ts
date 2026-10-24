import type { Coord } from '../map/coord';

export interface Cause {
  key: string;
  // Share of the city's Citizens the Cause hurts, from 0 to 1.
  weight: number;
  params: Readonly<Record<string, number | string>>;
  focus: readonly Coord[];
}

export interface Diagnosis {
  causes: readonly Cause[];
}

export const DIAGNOSIS = {
  minWeight: 0.05,
  maxCauses: 3,
};

export function diagnosisOf(candidates: readonly Cause[]): Diagnosis {
  const causes = candidates
    .filter(cause => cause.weight >= DIAGNOSIS.minWeight)
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
    .slice(0, DIAGNOSIS.maxCauses);
  return { causes };
}
