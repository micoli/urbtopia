import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { KNOWLEDGE, cityKnowledge, createBuilding, energySavingOf, newGame, utilityDemand, wasteReductionOf, wasteReport, type Building, type GameState } from '../index';
import { knowledgeCurve } from '../services/knowledge';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const original = { ...KNOWLEDGE.effects };
afterEach(() => {
  Object.assign(KNOWLEDGE.effects, original);
});

const b = (id: number, type: Building['type'], x: number, y = 0, tier = 1): Building => ({ ...createBuilding(id, type, x + 50, y + 50, 0), tier });
const homes = [b(2, 'home', 3, 0, 3), b(3, 'home', 3, 6, 3)];
const schooled = (): GameState => ({ ...newGame({ seed: 'footprint', now: 0 }), nextId: 100, tutorial: null, buildings: [b(1, 'school', 0), b(4, 'library', 6, 3, 5), ...homes] });
const bare = (): GameState => ({ ...schooled(), buildings: homes });

describe('Knowledge and Waste', () => {
  it('cuts the Waste Citizens produce by the effect', () => {
    const state = schooled();
    expect(wasteReductionOf(state)).toBeCloseTo(KNOWLEDGE.effects.waste * knowledgeCurve(cityKnowledge(state)!), 8);
    expect(wasteReductionOf(bare())).toBe(0);
  });

  it('lowers the Waste a Home produces', () => {
    const produced = (state: GameState) => wasteReport(state).homes.get(2)!.produced;
    expect(produced(schooled())).toBeLessThan(produced(bare()));
  });
});

describe('Knowledge and power', () => {
  it('cuts the power demand, and so the emissions that follow it, by the effect', () => {
    const state = schooled();
    expect(energySavingOf(state)).toBeCloseTo(KNOWLEDGE.effects.power * knowledgeCurve(cityKnowledge(state)!), 8);
    expect(energySavingOf(bare())).toBe(0);
  });

  it('lowers the power the Homes ask for', () => {
    const withSaving = utilityDemand(schooled()).power;
    KNOWLEDGE.effects.power = 0;
    expect(utilityDemand({ ...schooled() }).power).toBeGreaterThan(withSaving);
  });
});
