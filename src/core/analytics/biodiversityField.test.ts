import { describe, expect, it } from 'vitest';
import { DATA_LAYERS, createBuilding, newGame, type Building, type GameState } from '../index';
import { biodiversityField } from './biodiversityField';
import { homeTintsOf } from './homeTints';
import { LAYER_SCALES } from './scales';
import { fieldValueAt, paintedValues } from './tileField';

const base = newGame({ seed: 'biodiversity-field', now: 0 });
const city = (...buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000, adaptationUntil: 0 });

describe('Biodiversity layer', () => {
  it('is one of the data Layers, drawn with a scale', () => {
    expect(DATA_LAYERS).toContain('biodiversity');
    expect(LAYER_SCALES['data.biodiversity']).toHaveLength(1);
  });
});

describe('Biodiversity field', () => {
  it('paints every owned tile at 0 when there is no Green space', () => {
    const values = paintedValues(biodiversityField(city()));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.max(...values)).toBe(0);
  });

  it('is higher beside a Park than far from it, and never above 100', () => {
    const field = biodiversityField(city(createBuilding(1, 'park', 60, 60, 0)));
    expect(fieldValueAt(field, 62, 60)).toBeGreaterThan(0);
    expect(fieldValueAt(field, 120, 120)).toBe(0);
    expect(Math.max(...paintedValues(field))).toBeLessThanOrEqual(100);
  });

  it('adds with a second Green space, with diminishing returns', () => {
    const one = fieldValueAt(biodiversityField(city(createBuilding(1, 'park', 60, 60, 0))), 62, 62);
    const two = fieldValueAt(biodiversityField(city(createBuilding(1, 'park', 60, 60, 0), createBuilding(2, 'park', 64, 60, 0))), 62, 62);
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(2 * one);
  });
});

describe('Biodiversity tints', () => {
  it('tints each Home by the Biodiversity it enjoys', () => {
    const state = city(createBuilding(1, 'park', 50, 50, 0), createBuilding(2, 'home', 53, 50, 0), createBuilding(3, 'home', 120, 120, 0));
    const [near, far] = homeTintsOf(state, 'data.biodiversity', 'education');
    expect(near!.share).toBeGreaterThan(0);
    expect(far!.share).toBe(0);
    expect(near!.ramp).toBe('biodiversity');
  });
});
