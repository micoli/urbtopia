import { describe, expect, it } from 'vitest';
import { createBuilding, homeBenefits, newGame, stadiumsReaching, STADIUM, type Building, type GameState } from '../index';

const building = (id: number, type: Building['type'], x: number, y: number): Building => createBuilding(id, type, x, y, 0);
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'stadium', now: 0 }), tutorial: null, adaptationUntil: 0, buildings });

describe('Stadium', () => {
  const stadium = building(1, 'stadium', 50, 50);

  it('reaches only Homes inside its radius', () => {
    const near = building(2, 'home', 55, 51);
    const far = building(3, 'home', 50 + STADIUM.radius + 10, 51);
    const state = city(stadium, near, far);
    expect(stadiumsReaching(state, near)).toHaveLength(1);
    expect(stadiumsReaching(state, far)).toHaveLength(0);
  });

  it('raises the Well-being of Homes in reach, without power', () => {
    const home = building(2, 'home', 55, 51);
    const without = homeBenefits(city(home), home).wellbeing;
    const withStadium = homeBenefits(city(stadium, home), home).wellbeing;
    expect(withStadium).toBeGreaterThan(without);
  });
});
