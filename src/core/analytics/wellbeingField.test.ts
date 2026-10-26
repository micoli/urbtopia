import { describe, expect, it } from 'vitest';
import { FACILITIES, createBuilding, newGame, type Building, type GameState } from '../index';
import { fieldValueAt, paintedValues } from './tileField';
import { wellbeingField } from './wellbeingField';

const base = newGame({ seed: 'wellbeing-field', now: 0 });
const city = (...buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000, adaptationUntil: 0 });

describe('well-being field', () => {
  it('paints every owned tile within 0 and 100', () => {
    const values = paintedValues(wellbeingField(city()));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(100);
  });

  it('is higher beside a Green space than far from it', () => {
    const state = city(createBuilding(1, 'park', 60, 60, 0));
    const field = wellbeingField(state);
    expect(fieldValueAt(field, 62, 60)).toBeGreaterThan(fieldValueAt(field, 110, 110));
  });

  it('counts the facilities that reach the tile', () => {
    const state = city(createBuilding(1, 'school', 60, 60, 0));
    const field = wellbeingField(state);
    const radius = FACILITIES.school.radius!;
    expect(fieldValueAt(field, 62, 60)).toBeGreaterThan(fieldValueAt(field, 60 + radius + 6, 60));
  });

  it('is lower beside a polluting Coal plant', () => {
    const clean = wellbeingField(city(createBuilding(1, 'park', 62, 60, 0), createBuilding(2, 'home', 70, 60, 0)));
    const dirty = wellbeingField(city(createBuilding(1, 'park', 62, 60, 0), createBuilding(2, 'home', 70, 60, 0), createBuilding(3, 'coalPlant', 66, 60, 0)));
    expect(fieldValueAt(dirty, 64, 60)).toBeLessThan(fieldValueAt(clean, 64, 60));
  });

  it('does not depend on the order of the buildings', () => {
    const a = createBuilding(1, 'school', 60, 60, 0), b = createBuilding(2, 'park', 70, 70, 0);
    expect(wellbeingField(city(a, b)).values).toEqual(wellbeingField(city(b, a)).values);
  });

  it('leaves the state untouched', () => {
    const state = city(createBuilding(1, 'school', 60, 60, 0));
    const before = JSON.stringify(state);
    wellbeingField(state);
    expect(JSON.stringify(state)).toBe(before);
  });
});
