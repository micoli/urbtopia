import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { attractionPowerOf, isAttraction, spendingFactor, touristDemand, TOURISM } from './tourists';

const building = (id: number, type: Building['type'], extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, 10 * id, 10, 0), ...extra });
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'tourism', now: 0 }), buildings });

describe('tourist demand', () => {
  it('is zero without an Attraction', () => {
    expect(touristDemand(city(building(1, 'home')))).toBe(0);
  });

  it('counts a Museum, the Colosseum, stadiums and the Concert hall as Attractions, not a Hotel', () => {
    for (const type of ['masMuseum', 'colosseum', 'footballStadium', 'concertHall', 'casino', 'marina'] as const) expect(isAttraction({ type })).toBe(true);
    expect(isAttraction({ type: 'hotel' })).toBe(false);
  });

  it('grows with the number of Attractions', () => {
    const one = touristDemand(city(building(1, 'colosseum')));
    const two = touristDemand(city(building(1, 'colosseum'), building(2, 'footballStadium')));
    expect(two).toBeGreaterThan(one);
  });

  it('is raised by the Tier of an Attraction', () => {
    const tierOne = attractionPowerOf(building(1, 'concertHall', { tier: 1 }));
    const tierThree = attractionPowerOf(building(1, 'concertHall', { tier: 3 }));
    expect(tierThree).toBeCloseTo(tierOne * (1 + 2 * TOURISM.tierBonus));
  });

  it('is unchanged by a Hotel, which only raises spending', () => {
    const base = city(building(1, 'colosseum'));
    const lodged = city(building(1, 'colosseum'), building(2, 'hotel'));
    expect(spendingFactor(base)).toBe(1);
    expect(spendingFactor(lodged)).toBe(1 + TOURISM.hotelSpendingBonus);
    expect(touristDemand(lodged)).toBeGreaterThanOrEqual(touristDemand(base));
  });
});
