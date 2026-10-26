import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { CONGESTION, citizensOf, congestionStats, createBuilding, newGame, tileKey, type Building, type GameState } from '../index';
import { carsField, congestionField } from './roadFields';
import { fieldValueAt } from './tileField';

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
    expect(fieldValueAt(congestionField(state), 55, 58)).toBeCloseTo(Math.min(CONGESTION.maxRatio, section.ratio) * 100);
  });

  it('is capped at the maximum ratio', () => {
    const field = congestionField(withHome(base, 56, 59, 8));
    expect(field.max).toBe(CONGESTION.maxRatio * 100);
    expect(Math.max(...field.values)).toBeLessThanOrEqual(field.max);
  });
});
