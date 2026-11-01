import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { KNOWLEDGE, createBuilding, newGame, type Building, type GameState } from '../index';
import { knowledgeCodexFigures } from './knowledgeCodexFigures';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const b = (id: number, type: Building['type'], x: number, y = 0): Building => createBuilding(id, type, x + 50, y + 50, 0);
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({ ...newGame({ seed: 'knowledge-codex', now: 0 }), buildings, nextId: 100, adaptationUntil: 0, ...extra });

describe('Knowledge codex figures', () => {
  it('lists what builds Knowledge from the balance data', () => {
    const figures = knowledgeCodexFigures(city([]));
    expect(figures.schooling.map(({ type, points }) => [type, points])).toEqual([['school', 15], ['middleSchool', 15], ['highSchool', 20], ['university', 20]]);
    expect(figures.library).toEqual(KNOWLEDGE.library.map((points, index) => ({ tier: index + 1, points })));
    expect(figures.required).toBe(50);
  });

  it('gives the effects at the current Knowledge next to their maximum', () => {
    const figures = knowledgeCodexFigures(city([b(1, 'school', 0), b(2, 'home', 3)]));
    expect(figures.knowledge).toBe(15);
    expect(figures.effects.map(effect => effect.id)).toEqual(['production', 'office', 'tax', 'wellbeing', 'waste', 'power']);
    for (const effect of figures.effects) {
      expect(effect.maximum).toBe(KNOWLEDGE.effects[effect.id]);
      expect(effect.current).toBeGreaterThan(0);
      expect(effect.current).toBeLessThan(effect.maximum);
    }
  });

  it('counts the Homes below the required Knowledge', () => {
    const figures = knowledgeCodexFigures(city([b(1, 'school', 0), b(2, 'home', 3), b(3, 'home', 40)]));
    expect(figures.homes).toBe(2);
    expect(figures.belowRequired).toBe(2);
    expect(knowledgeCodexFigures(city([b(1, 'school', 0), b(4, 'middleSchool', 0, 4), b(5, 'highSchool', 0, 8), b(2, 'home', 3)])).belowRequired).toBe(0);
  });

  it('has no Knowledge and no effect in a city without Citizens', () => {
    const figures = knowledgeCodexFigures(city([]));
    expect(figures.knowledge).toBeNull();
    expect(figures.effects.every(effect => effect.current === 0)).toBe(true);
  });
});
