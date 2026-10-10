import { describe, expect, it } from 'vitest';
import { progressColor } from './progressColor';

describe('progressColor', () => {
  it('goes from red at 0 through orange at 50% to green at 100%', () => {
    expect(progressColor(0)).toBe('hsl(0 80% 50% / 0.3)');
    expect(progressColor(0.5)).toBe('hsl(30 80% 50% / 0.3)');
    expect(progressColor(1)).toBe('hsl(130 80% 50% / 0.3)');
  });

  it('stays within the range', () => {
    expect(progressColor(-1)).toBe(progressColor(0));
    expect(progressColor(2)).toBe(progressColor(1));
  });
});
