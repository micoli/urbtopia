import { describe, expect, it } from 'vitest';
import { fitScale } from './quaternius';

describe('model scale', () => {
  it('fits a model by its widest side', () => {
    expect(fitScale({ width: 50, height: 10, depth: 200 }, 0.4)).toBeCloseTo(0.002);
  });
});
