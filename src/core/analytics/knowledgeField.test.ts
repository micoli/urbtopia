import { describe, expect, it } from 'vitest';
import { DATA_LAYERS, createBuilding, newGame, type Building, type GameState } from '../index';
import { fieldValueAt, paintedValues } from './tileField';
import { knowledgeField } from './knowledgeField';
import { homeTintsOf } from './homeTints';
import { LAYER_SCALES } from './scales';

const base = newGame({ seed: 'knowledge-field', now: 0 });
const city = (...buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000, adaptationUntil: 0 });
const library = (tier: number): Building => ({ ...createBuilding(1, 'library', 60, 60, 0), tier });

describe('Knowledge layer', () => {
  it('is one of the data Layers, drawn with a scale', () => {
    expect(DATA_LAYERS).toContain('knowledge');
    expect(LAYER_SCALES['data.knowledge']).toHaveLength(1);
  });
});

describe('Knowledge field', () => {
  it('paints every owned tile within 0 and 100', () => {
    const values = paintedValues(knowledgeField(city()));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(0);
  });

  it('counts the School degrees that reach the tile', () => {
    const field = knowledgeField(city(createBuilding(1, 'school', 60, 60, 0)));
    expect(fieldValueAt(field, 62, 60)).toBe(15);
    expect(fieldValueAt(field, 120, 120)).toBe(0);
  });

  it('counts the best Library reaching the tile, further when it is upgraded', () => {
    const near = knowledgeField(city(library(1)));
    const upgraded = knowledgeField(city(library(5)));
    expect(fieldValueAt(near, 62, 60)).toBe(6);
    expect(fieldValueAt(upgraded, 62, 60)).toBe(30);
    expect(fieldValueAt(near, 60 + 16, 60)).toBe(0);
    expect(fieldValueAt(upgraded, 60 + 16, 60)).toBe(30);
  });

  it('leaves the state untouched', () => {
    const state = city(library(3));
    const before = JSON.stringify(state);
    knowledgeField(state);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('Knowledge tints', () => {
  it('tints each Home by its Knowledge', () => {
    const state = city(createBuilding(1, 'school', 50, 50, 0), createBuilding(2, 'home', 53, 50, 0), createBuilding(3, 'home', 120, 120, 0));
    const [covered, bare] = homeTintsOf(state, 'data.knowledge', 'education');
    expect(covered!.share).toBeCloseTo(0.15);
    expect(bare!.share).toBe(0);
  });
});
