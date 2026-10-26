import { describe, expect, it } from 'vitest';
import { createBuilding, homeBenefits, newGame, type Building, type GameState } from '../index';
import { COVERAGE_SHARE, homeTintsOf } from './homeTints';

const base = newGame({ seed: 'home-tints', now: 0 });
const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const city = (buildings: Building[]): GameState => ({ ...base, buildings, nextId: 1000, adaptationUntil: 0 });

describe('coverage tints', () => {
  it('tints a Home beside a facility as covered and a far one as uncovered', () => {
    const state = city([home(1, 60, 60), home(2, 120, 120), createBuilding(3, 'school', 62, 60, 0)]);
    const tints = homeTintsOf(state, 'data.coverage', 'education');
    expect(tints.map(tint => tint.share)).toEqual([COVERAGE_SHARE.covered, COVERAGE_SHARE.uncovered]);
  });

  it('tints every Home as uncovered in a category without facility', () => {
    const tints = homeTintsOf(city([home(1, 60, 60)]), 'data.coverage', 'health');
    expect(tints.map(tint => tint.share)).toEqual([COVERAGE_SHARE.uncovered]);
  });

  it('follows the footprint of the Home', () => {
    const [tint] = homeTintsOf(city([home(1, 60, 60, 3)]), 'data.coverage', 'waste');
    expect(tint).toMatchObject({ x: 60, y: 60, ramp: 'coverage' });
    expect(tint!.width).toBeGreaterThanOrEqual(1);
  });

  it('draws nothing for tile field layers', () => {
    expect(homeTintsOf(city([home(1, 60, 60)]), 'data.pollution', 'education')).toEqual([]);
  });
});

describe('well-being tints', () => {
  it('reads the Well-being shown for the Home, over 100', () => {
    const state = city([home(1, 60, 60), home(2, 70, 60, 2)]);
    const tints = homeTintsOf(state, 'data.wellbeing', 'education');
    state.buildings.forEach((building, index) => {
      expect(tints[index]!.share).toBeCloseTo(Math.min(1, Math.max(0, homeBenefits(state, building).wellbeing / 100)));
      expect(tints[index]!.ramp).toBe('wellbeing');
    });
  });
});
