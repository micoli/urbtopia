import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { cityKnowledge, citizensOf, createBuilding, homeKnowledge, newGame, type Building, type GameState } from '../index';
import { knowledgeBalanceSchema } from '../balance/balanceSchemas';
import knowledgeFile from '../../../assets/defs/balance/knowledge.json';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const b = (id: number, type: Building['type'], x: number, y = 0, extra: Partial<Building> = {}) => ({ ...createBuilding(id, type, x + 50, y + 50, 0), ...extra });
const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'knowledge', now: 0 }), buildings, nextId: 100, urbs: 1_000_000, tutorial: null, adaptationUntil: 0,
});
const home = (id = 2, x = 3) => b(id, 'home', x);
const knowledgeAt = (buildings: Building[], target = 2) => {
  const state = city(buildings);
  return homeKnowledge(state, state.buildings.find(building => building.id === target)!);
};

describe('Knowledge balance', () => {
  it('is valid', () => {
    expect(knowledgeBalanceSchema.safeParse(knowledgeFile).success).toBe(true);
  });
});

describe('Knowledge of a Home', () => {
  it('is nil without a School or a Library', () => {
    expect(knowledgeAt([home()])).toBe(0);
  });

  it('adds the share of each distinct School degree', () => {
    expect(knowledgeAt([b(1, 'school', 0), home()])).toBe(15);
    expect(knowledgeAt([b(1, 'school', 0), b(3, 'middleSchool', 0, 4), home()])).toBe(30);
    expect(knowledgeAt([b(1, 'school', 0), b(3, 'middleSchool', 0, 4), b(4, 'highSchool', 0, 8), b(5, 'university', 0, 12), home()])).toBe(70);
  });

  it('counts a degree once however many Schools of it cover the Home', () => {
    expect(knowledgeAt([b(1, 'school', 0), b(3, 'school', 0, 4), home()])).toBe(15);
  });

  it.each([[1, 6], [2, 12], [3, 18], [4, 24], [5, 30]])('gives a Tier %i Library %i points', (tier, points) => {
    expect(knowledgeAt([b(1, 'library', 0, 0, { tier }), home()])).toBe(points);
  });

  it('combines Schooling and Library so that only both reach 100', () => {
    const schools = [b(1, 'school', 0), b(3, 'middleSchool', 0, 4), b(4, 'highSchool', 0, 8), b(5, 'university', 0, 12)];
    expect(knowledgeAt([...schools, b(6, 'library', 5, 0, { tier: 5 }), home()])).toBeCloseTo(100 - 30 * 0.7, 5);
    expect(knowledgeAt([...schools, home()])).toBe(70);
  });

  it('keeps the best Tier when several Libraries cover the Home', () => {
    expect(knowledgeAt([b(1, 'library', 0, 0, { tier: 1 }), b(3, 'library', 0, 4, { tier: 3 }), home()])).toBe(18);
  });

  it('ignores a facility that does not cover the Home', () => {
    expect(knowledgeAt([b(1, 'school', 0), home(2, 40)])).toBe(0);
  });
});

describe('Knowledge of the city', () => {
  it('has none without Homes', () => {
    expect(cityKnowledge(city([b(1, 'school', 0)]))).toBeNull();
  });

  it('weighs each Home by its Citizens', () => {
    const covered = b(2, 'home', 3, 0, { tier: 6 });
    const alone = b(3, 'home', 40, 0, { tier: 1 });
    const expected = (15 * citizensOf(6)) / (citizensOf(6) + citizensOf(1));
    expect(cityKnowledge(city([b(1, 'school', 0), covered, alone]))).toBeCloseTo(expected, 5);
  });
});
