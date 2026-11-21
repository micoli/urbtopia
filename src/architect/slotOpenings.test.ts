import { describe, expect, it } from 'vitest';
import { BRICKS } from '../core/architect/housePlan.ts';
import { OPENINGS, cornerOutlines } from './slotOpenings.ts';

describe('the openings of the slot', () => {
  it('give every brick but the wall a hole that fits in a slot', () => {
    for (const brick of BRICKS.filter((candidate) => candidate !== 'wall')) {
      const { width, bottom, height } = OPENINGS[brick as keyof typeof OPENINGS];
      expect(width, brick).toBeGreaterThan(0);
      expect(width, brick).toBeLessThanOrEqual(0.8);
      expect(bottom, brick).toBeGreaterThanOrEqual(0);
      expect(bottom + height, brick).toBeLessThanOrEqual(1);
    }
  });

  it('leave corners to fill only where the model closes the hole with a round head or a circle', () => {
    expect(cornerOutlines(OPENINGS.window)).toEqual([]);
    expect(cornerOutlines(OPENINGS.windowArched)).toHaveLength(2);
    expect(cornerOutlines(OPENINGS.doorArched)).toHaveLength(2);
    expect(cornerOutlines(OPENINGS.windowRound)).toHaveLength(4);
  });

  it('keep the corners outside the circle and reach under the wall around them', () => {
    const opening = OPENINGS.windowRound;
    const radius = opening.width / 2;
    const centre = opening.bottom + opening.height / 2;
    for (const outline of cornerOutlines(opening)) {
      for (const [x, y] of outline) {
        expect(Math.hypot(x, y - centre)).toBeGreaterThanOrEqual(radius - 1e-9);
        expect(Math.abs(x)).toBeLessThanOrEqual(radius + 0.011);
      }
      expect(outline.some(([x]) => Math.abs(x) > radius + 1e-9)).toBe(true);
    }
  });

  it('hold the two corners of an arch above the spring of the arch', () => {
    const { width, bottom, height } = OPENINGS.windowArched;
    const spring = bottom + height - width / 2;
    for (const outline of cornerOutlines(OPENINGS.windowArched)) for (const [, y] of outline) expect(y).toBeGreaterThanOrEqual(spring - 1e-9);
  });
});
