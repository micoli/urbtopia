import { describe, expect, it } from 'vitest';
import { seatFactions, seatPositions } from './councilSeats';

describe('seatFactions', () => {
  it('gives each Faction its seats', () => {
    const order = seatFactions({ economy: 3, environment: 3, services: 3 });
    expect(order).toHaveLength(9);
    for (const faction of ['economy', 'environment', 'services'] as const) expect(order.filter(seat => seat === faction)).toHaveLength(3);
  });

  it('makes the Factions take turns, so none holds a stretch of the circle', () => {
    expect(seatFactions({ economy: 3, environment: 3, services: 3 })).toEqual(['economy', 'environment', 'services', 'economy', 'environment', 'services', 'economy', 'environment', 'services']);
  });

  it('keeps the turns when the seats are unequal', () => {
    expect(seatFactions({ economy: 5, environment: 3, services: 1 })).toEqual(['economy', 'environment', 'services', 'economy', 'environment', 'economy', 'environment', 'economy', 'economy']);
  });
});

describe('seatPositions', () => {
  it('starts at the top and spreads the seats evenly', () => {
    const positions = seatPositions(4, 10);
    expect(positions[0]!.x).toBeCloseTo(0);
    expect(positions[0]!.y).toBeCloseTo(-10);
    expect(positions[1]!.x).toBeCloseTo(10);
    expect(positions[2]!.y).toBeCloseTo(10);
  });
});
