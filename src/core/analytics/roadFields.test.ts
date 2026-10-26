import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { CONGESTION, citizensOf, congestionStats, createBuilding, newGame, tileKey, type Building, type GameState } from '../index';
import { carsField, congestionField } from './roadFields';
import { fieldValueAt, paintedValues } from './tileField';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const base = newGame({ seed: 'road-fields', now: 0 });
const withHome = (state: GameState, x: number, y: number, tier: number): GameState => {
  const home: Building = { ...createBuilding(state.nextId, 'home', x, y, 0), tier };
  return { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, home] };
};

describe('cars field', () => {
  it('reads the Commuters loading each Road tile, scaled on the busiest one', () => {
    const state = withHome(base, 56, 59, 1);
    const field = carsField(state);
    expect(fieldValueAt(field, 56, 58)).toBeCloseTo(citizensOf(1));
    expect(field.max).toBeCloseTo(Math.max(...field.values));
  });

  it('is empty off the loaded Roads', () => {
    const field = carsField(withHome(base, 56, 59, 1));
    expect(fieldValueAt(field, 100, 100)).toBe(0);
  });
});

describe('congestion field', () => {
  it('reads load over capacity in percent', () => {
    const state = withHome(base, 56, 59, 3);
    const section = congestionStats(state).sections.get(tileKey({ x: 55, y: 58 }))!;
    expect(fieldValueAt(congestionField(state), 55, 58)).toBeGreaterThanOrEqual(Math.min(CONGESTION.maxRatio, section.ratio) * 100 - 0.001);
  });

  it('is capped at the maximum ratio', () => {
    const field = congestionField(withHome(base, 56, 59, 8));
    expect(field.max).toBe(CONGESTION.maxRatio * 100);
    expect(Math.max(...paintedValues(field))).toBeLessThanOrEqual(field.max);
  });

  it('is painted on every owned tile, the tiles away from the Roads reading zero', () => {
    const field = congestionField(withHome(base, 56, 59, 1));
    expect(field.paintsZero).toBe(true);
    expect(fieldValueAt(field, 110, 110)).toBe(0);
    expect(Number.isNaN(field.values[0])).toBe(true);
  });

  it('spreads the worst Road section to the tiles around it', () => {
    const state = withHome(base, 56, 59, 3);
    const section = congestionStats(state).sections.get(tileKey({ x: 55, y: 58 }))!;
    expect(fieldValueAt(congestionField(state), 55, 61)).toBeGreaterThanOrEqual(Math.min(CONGESTION.maxRatio, section.ratio) * 100 - 0.001);
  });
});
