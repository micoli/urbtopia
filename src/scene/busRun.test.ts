import { describe, expect, it } from 'vitest';
import { nextRunTile } from './vehicleTraffic';

const tiles = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }];

describe('bus run on a loop', () => {
  it('wraps to the second tile after the closing tile instead of turning back', () => {
    const run = { tiles, index: 3, step: 1 as const, loop: true };
    expect(nextRunTile(run)).toEqual({ x: 0, y: 0 });
    expect(nextRunTile(run)).toEqual({ x: 1, y: 0 });
    expect(run.step).toBe(1);
  });
  it('still turns back at the end of an open line', () => {
    const run = { tiles, index: 3, step: 1 as const };
    nextRunTile(run);
    expect(nextRunTile(run)).toEqual({ x: 0, y: 1 });
  });
});
