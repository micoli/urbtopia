import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { interiorEconomyRows } from './interiorEconomy';

const running: Building['interior'] = {
  nextFixtureId: 10,
  fixtures: [
    { id: 1, type: 'factoryMotor', x: 2, y: 1, rotation: 0 },
    { id: 2, type: 'factoryShaft', x: 2, y: 2, rotation: 0 },
    { id: 3, type: 'factoryPress', x: 2, y: 3, rotation: 2 },
  ],
};

const city = (buildings: Building[]): GameState => ({ ...newGame({ seed: 'economy', now: 0 }), nextId: 100, tutorial: null, buildings });

describe('the economy of interiors and Venues', () => {
  it('lists nothing in a city with no Venue and no fitted-out interior', () => {
    expect(interiorEconomyRows(city([createBuilding(1, 'factory', 55, 50, 0)]))).toEqual([]);
  });

  it('lists a fitted-out Production interior with its power', () => {
    const [row, ...others] = interiorEconomyRows(city([{ ...createBuilding(1, 'factory', 55, 50, 0), tier: 5, interior: running }]));
    expect(others).toEqual([]);
    expect(row).toMatchObject({ kind: 'production' });
    expect(row!.power).toBeGreaterThan(0);
  });

  it('shows no power and no bonus once the breaker is off', () => {
    const [row] = interiorEconomyRows(city([{ ...createBuilding(1, 'factory', 55, 50, 0), tier: 5, interior: running, breakerOff: true }]));
    expect(row).toMatchObject({ power: 0 });
  });

  it('lists a Venue with its wages and income', () => {
    const [row] = interiorEconomyRows(city([createBuilding(2, 'arcade', 60, 50, 0)]));
    expect(row).toMatchObject({ kind: 'venue' });
    expect(row!.power).toBeGreaterThan(0);
  });

  it('lists the items that assigned Staff work on', () => {
    const bakery: Building = {
      ...createBuilding(3, 'bakery', 55, 50, 0),
      tier: 3,
      interior: { nextFixtureId: 5, fixtures: [{ id: 1, type: 'bakeryOven', x: 1, y: 1, rotation: 0, assigned: true, recipe: 'bread' }, { id: 2, type: 'bakeryOven', x: 2, y: 1, rotation: 0, recipe: 'fougasse' }] },
    };
    const [row] = interiorEconomyRows(city([bakery]));
    expect(row!.workedItems).toEqual(['bread']);
  });
});
