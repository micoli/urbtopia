import { describe, expect, it } from 'vitest';
import { SPORT_VENUES, SPORT_VENUE_TYPES, createBuilding, homeBenefits, newGame, sportVenuesReaching, type Building, type GameState } from '../index';

const building = (id: number, type: Building['type'], x: number, y: number): Building => createBuilding(id, type, x, y, 0);
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'sport', now: 0 }), tutorial: null, adaptationUntil: 0, buildings });

describe.each(SPORT_VENUE_TYPES)('Sport venue %s', (type) => {
  const { radius } = SPORT_VENUES[type];
  const venue = building(1, type, 50, 50);
  const nearHome = () => building(2, 'home', 50 + SPORT_VENUES[type].footprint.width + 1, 51);

  it('reaches only Homes inside its radius', () => {
    const near = nearHome();
    const far = building(3, 'home', 50 + radius + 40, 51);
    const state = city(venue, near, far);
    expect(sportVenuesReaching(state, near)).toHaveLength(1);
    expect(sportVenuesReaching(state, far)).toHaveLength(0);
  });

  it('raises the Well-being of Homes in reach, without power', () => {
    const home = nearHome();
    expect(homeBenefits(city(venue, home), home).wellbeing).toBeGreaterThan(homeBenefits(city(home), home).wellbeing);
  });
});
