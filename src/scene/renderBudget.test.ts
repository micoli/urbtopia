import { describe, expect, it } from 'vitest';
import { shouldRenderFrame } from './renderBudget';

describe('shouldRenderFrame', () => {
  it('skips frames that come too early', () => {
    expect(shouldRenderFrame(8)).toBe(false);
    expect(shouldRenderFrame(16.7)).toBe(false);
  });

  it('renders every second frame of a 60 Hz display', () => {
    expect(shouldRenderFrame(33.3)).toBe(true);
  });

  it('renders every fourth frame of a 120 Hz display', () => {
    expect(shouldRenderFrame(25)).toBe(false);
    expect(shouldRenderFrame(33.3)).toBe(true);
  });
});
