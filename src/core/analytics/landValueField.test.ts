import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { LAND_VALUE, landValueField } from './landValueField';
import { fieldValueAt } from './tileField';

const base = newGame({ seed: 'land-value', now: 0 });
const city = (...buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000, adaptationUntil: 0, roads: [] });
const at = (state: GameState, x: number, y: number) => fieldValueAt(landValueField(state), x, y);

describe('land value field', () => {
  it('is zero on a bare tile far from everything', () => {
    expect(at(city(), 70, 70)).toBe(0);
  });

  it('stays within 0 and the maximum', () => {
    const field = landValueField(city(createBuilding(1, 'school', 62, 60, 0), createBuilding(2, 'park', 63, 63, 0)));
    expect(Math.min(...field.values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...field.values)).toBeLessThanOrEqual(LAND_VALUE.max);
  });

  it('rises near a Public facility', () => {
    const withSchool = city(createBuilding(1, 'school', 62, 60, 0));
    expect(at(withSchool, 64, 60)).toBeGreaterThan(at(city(), 64, 60));
  });

  it('rises near a Green space', () => {
    expect(at(city(createBuilding(1, 'park', 62, 60, 0)), 64, 60)).toBeGreaterThan(at(city(), 64, 60));
  });

  it('falls beside a polluting Coal plant', () => {
    const park = createBuilding(1, 'park', 62, 60, 0);
    const home = createBuilding(2, 'home', 70, 60, 0);
    const clean = at(city(park, home), 64, 60);
    const polluted = at(city(park, home, createBuilding(3, 'coalPlant', 66, 60, 0)), 64, 60);
    expect(polluted).toBeLessThan(clean);
  });

  it('does not depend on the order of the buildings', () => {
    const a = createBuilding(1, 'school', 62, 60, 0), b = createBuilding(2, 'park', 70, 70, 0);
    expect(landValueField(city(a, b)).values).toEqual(landValueField(city(b, a)).values);
  });

  it('is computed from existing figures only: building it changes no state', () => {
    const state = city(createBuilding(1, 'school', 62, 60, 0));
    const before = JSON.stringify(state);
    landValueField(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('keeps nuisance weights and positive weights each summing to one', () => {
    expect(Object.values(LAND_VALUE.weights).reduce((sum, w) => sum + w, 0)).toBeCloseTo(1);
    expect(Object.values(LAND_VALUE.nuisanceWeights).reduce((sum, w) => sum + w, 0)).toBeCloseTo(1);
  });
});
