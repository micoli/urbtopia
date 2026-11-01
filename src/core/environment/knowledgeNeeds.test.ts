import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { NEED_FACTOR_IDS, createBuilding, needsPyramid, newGame, type Building, type GameState } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const b = (id: number, type: Building['type'], x: number, y = 0): Building => createBuilding(id, type, x + 50, y + 50, 0);
const city = (types: readonly Building['type'][]): GameState => ({
  ...newGame({ seed: 'knowledge-needs', now: 0 }), nextId: 100, tutorial: null, adaptationUntil: 0,
  buildings: [...types.map((type, index) => b(index + 1, type, 0, index * 4)), b(50, 'home', 3)],
});
const factor = (state: GameState) => needsPyramid(state).levels.flatMap(level => level.factors).find(candidate => candidate.id === 'knowledge')!;

describe('Knowledge Need factor', () => {
  it('is a factor of the Esteem level that adds to Well-being', () => {
    expect(NEED_FACTOR_IDS).toContain('knowledge');
    const found = factor(city([]));
    expect(found.level).toBe('esteem');
    expect(found.effects).toContain('wellbeing');
    expect(found.effects).not.toContain('tierUpgrade');
  });

  it('is nil without Knowledge', () => {
    expect(factor(city([])).satisfaction).toBe(0);
  });

  it('reaches 100 at the required Knowledge', () => {
    expect(factor(city(['school', 'middleSchool'])).satisfaction).toBeCloseTo(60);
    expect(factor(city(['school', 'middleSchool', 'highSchool'])).satisfaction).toBe(100);
  });
});
