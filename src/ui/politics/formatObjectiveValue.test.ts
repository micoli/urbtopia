import { describe, expect, it } from 'vitest';
import { formatObjectiveValue } from './formatObjectiveValue';

describe('formatObjectiveValue', () => {
  it('shows shares as percentages', () => {
    expect(formatObjectiveValue('wasteCoverage', 0.846)).toBe('85 %');
    expect(formatObjectiveValue('congestion', 0.2)).toBe('20 %');
    expect(formatObjectiveValue('greenShare', 1)).toBe('100 %');
  });

  it('shows satisfactions and Citizens as whole numbers', () => {
    expect(formatObjectiveValue('vitalSatisfaction', 69.6)).toBe('70');
    expect(formatObjectiveValue('citizens', 412)).toBe('412');
  });

  it('shows a dash while the city cannot be measured', () => {
    expect(formatObjectiveValue('citizens', null)).toBe('—');
  });
});
