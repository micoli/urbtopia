import { describe, expect, it } from 'vitest';
import { FACILITIES, createBuilding, newGame, type Building, type GameState } from '../index';
import { coverageField } from './coverageField';
import { fieldValueAt } from './tileField';

const base = newGame({ seed: 'coverage-field', now: 0 });
const city = (...buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000 });

describe('coverage field', () => {
  it('paints every owned tile, covered near a facility and uncovered elsewhere', () => {
    const state = city(createBuilding(1, 'school', 60, 60, 0));
    const field = coverageField(state, 'education');
    expect(field.paintsZero).toBe(true);
    expect(fieldValueAt(field, 62, 60)).toBe(1);
    const radius = FACILITIES.school.radius!;
    expect(fieldValueAt(field, 60 + radius + 6, 60)).toBe(0);
    expect(Number.isNaN(field.values[0])).toBe(true);
  });

  it('is uncovered everywhere in a category without a facility', () => {
    const field = coverageField(city(), 'health');
    const owned = field.values.filter(value => !Number.isNaN(value));
    expect(owned.length).toBeGreaterThan(0);
    expect(owned.every(value => value === 0)).toBe(true);
  });

  it('keeps the categories apart', () => {
    const state = city(createBuilding(1, 'school', 60, 60, 0));
    expect(fieldValueAt(coverageField(state, 'health'), 62, 60)).toBe(0);
  });

  it('does not depend on the order of the buildings', () => {
    const a = createBuilding(1, 'school', 60, 60, 0), b = createBuilding(2, 'school', 70, 70, 0);
    expect(coverageField(city(a, b), 'education').values).toEqual(coverageField(city(b, a), 'education').values);
  });
});
