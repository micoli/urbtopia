import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { KNOWLEDGE, cityKnowledge, createBuilding, homeBenefits, homeTaxMultiplier, needsContext, newGame, type Building, type GameState } from '../index';
import { knowledgeCurve, knowledgeEffect } from './knowledge';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const b = (id: number, type: Building['type'], x: number, y = 0, extra: Partial<Building> = {}) => ({ ...createBuilding(id, type, x + 50, y + 50, 0), ...extra });
const schooled = (): GameState => ({
  ...newGame({ seed: 'effects', now: 0 }), nextId: 100, urbs: 1_000_000, tutorial: null, adaptationUntil: 0, difficulty: 'easy',
  buildings: [b(1, 'school', 0), b(3, 'middleSchool', 0, 4), b(4, 'library', 5, 0, { tier: 5 }), b(2, 'home', 3)],
});
const bare = (): GameState => ({ ...schooled(), buildings: [b(2, 'home', 3)] });

const original = { ...KNOWLEDGE.effects };
afterEach(() => {
  Object.assign(KNOWLEDGE.effects, original);
});

describe('Knowledge curve', () => {
  it('is nil at 0, full at 100 and 70% at 50', () => {
    expect(knowledgeCurve(0)).toBe(0);
    expect(knowledgeCurve(100)).toBe(1);
    expect(knowledgeCurve(50)).toBeCloseTo(0.7, 2);
  });

  it('only rises', () => {
    const values = [0, 10, 25, 50, 75, 90, 100].map(knowledgeCurve);
    expect(values).toEqual([...values].sort((a, c) => a - c));
  });
});

describe('Knowledge effect', () => {
  it('is nil in a city without Citizens or Knowledge', () => {
    expect(knowledgeEffect({ ...bare(), buildings: [] }, 'tax')).toBe(0);
    expect(knowledgeEffect(bare(), 'tax')).toBe(0);
  });

  it('scales the maximum of the effect with the Knowledge of the city', () => {
    const state = schooled();
    expect(knowledgeEffect(state, 'tax')).toBeCloseTo(KNOWLEDGE.effects.tax * knowledgeCurve(cityKnowledge(state)!), 8);
  });
});

describe('Knowledge and Well-being', () => {
  it('adds up to the Well-being points of the effect', () => {
    const state = schooled();
    const home = state.buildings.find(building => building.id === 2)!;
    const withBonus = homeBenefits(state, home);
    KNOWLEDGE.effects.wellbeing = 0;
    const without = homeBenefits({ ...state }, home);
    expect(withBonus.knowledgeBonus).toBeCloseTo(8 * knowledgeCurve(cityKnowledge(state)!), 5);
    expect(withBonus.wellbeing - without.wellbeing).toBeCloseTo(withBonus.knowledgeBonus, 5);
    expect(withBonus.wellbeing).toBeLessThanOrEqual(100);
  });

  it('adds nothing without Knowledge', () => {
    const state = bare();
    expect(homeBenefits(state, state.buildings[0]!).knowledgeBonus).toBe(0);
  });
});

describe('Knowledge and Tax', () => {
  it('raises the Tax of a Home by the effect, on top of Well-being', () => {
    const state = schooled();
    const home = state.buildings.find(building => building.id === 2)!;
    const withBonus = homeTaxMultiplier(state, home, needsContext(state));
    KNOWLEDGE.effects.tax = 0;
    const fresh = { ...state };
    const without = homeTaxMultiplier(fresh, home, needsContext(fresh));
    expect(withBonus / without).toBeCloseTo(1 + 0.05 * knowledgeCurve(cityKnowledge(state)!), 5);
  });
});
