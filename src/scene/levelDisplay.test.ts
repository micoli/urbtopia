import { describe, expect, it } from 'vitest';
import { surfaceDisplayOf } from './levelDisplay';

describe('surfaceDisplayOf', () => {
  it('draws the Surface in full on the Surface', () => {
    expect(surfaceDisplayOf(0, false)).toBe('full');
    expect(surfaceDisplayOf(0, true)).toBe('full');
  });

  it('draws the Surface as a ghost under it', () => {
    expect(surfaceDisplayOf(-1, false)).toBe('ghost');
    expect(surfaceDisplayOf(-2, false)).toBe('ghost');
  });

  it('hides the Surface under it when the device is slow', () => {
    expect(surfaceDisplayOf(-1, true)).toBe('hidden');
  });
});
