import { describe, expect, it } from 'vitest';
import { DIAGNOSIS, diagnosisOf, type Cause } from './diagnosis';

const cause = (key: string, weight: number): Cause => ({ key, weight, params: {}, focus: [] });

describe('diagnosisOf', () => {
  it('sorts the Causes by weight, heaviest first', () => {
    const { causes } = diagnosisOf([cause('b', 0.2), cause('a', 0.5), cause('c', 0.3)]);
    expect(causes.map(entry => entry.key)).toEqual(['a', 'c', 'b']);
  });

  it('breaks ties by key', () => {
    const { causes } = diagnosisOf([cause('z', 0.4), cause('m', 0.4)]);
    expect(causes.map(entry => entry.key)).toEqual(['m', 'z']);
  });

  it('drops the Causes that hurt too few Citizens', () => {
    const { causes } = diagnosisOf([cause('weak', DIAGNOSIS.minWeight / 2), cause('strong', 0.5)]);
    expect(causes.map(entry => entry.key)).toEqual(['strong']);
  });

  it('keeps the first three', () => {
    const { causes } = diagnosisOf([cause('a', 0.9), cause('b', 0.8), cause('c', 0.7), cause('d', 0.6)]);
    expect(causes.map(entry => entry.key)).toEqual(['a', 'b', 'c']);
  });

  it('is empty when nothing is wrong', () => {
    expect(diagnosisOf([]).causes).toEqual([]);
  });
});
