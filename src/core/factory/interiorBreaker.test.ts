import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, economicPower, isVenuePowered, newGame, type Building, type Command, type GameState } from '../index';
import { interiorBonusOfBuilding, interiorPowerOfBuilding } from './interiorBonus';

const running: Building['interior'] = {
  nextFixtureId: 10,
  fixtures: [
    { id: 1, type: 'factoryMotor', x: 2, y: 1, rotation: 0 },
    { id: 2, type: 'factoryShaft', x: 2, y: 2, rotation: 0 },
    { id: 3, type: 'factoryPress', x: 2, y: 3, rotation: 2 },
  ],
};

const city = (): GameState => ({
  ...newGame({ seed: 'breaker', now: 0 }),
  nextId: 100,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'factory', 55, 50, 0), tier: 5, interior: running }, createBuilding(2, 'coalPlant', 60, 50, 0), { ...createBuilding(3, 'arcade', 64, 50, 0), tier: 1 }],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const factory = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;

describe('the breaker of a Production interior', () => {
  it('is on by default and the interior draws power and gives its bonus', () => {
    expect(factory(city()).breakerOff).toBeUndefined();
    expect(interiorPowerOfBuilding(factory(city()))).toBeGreaterThan(0);
    expect(interiorBonusOfBuilding(factory(city())).speed).toBeGreaterThan(0);
  });

  it('cuts all the power and the bonus when it is switched off', () => {
    const off = factory(send(city(), { type: 'SetInteriorBreaker', buildingId: 1, off: true }));
    expect(off.breakerOff).toBe(true);
    expect(interiorPowerOfBuilding(off)).toBe(0);
    expect(interiorBonusOfBuilding(off)).toEqual({ speed: 0, yield: 0, power: 0 });
  });

  it('brings everything back when it is switched on again', () => {
    const off = send(city(), { type: 'SetInteriorBreaker', buildingId: 1, off: true });
    const on = factory(send(off, { type: 'SetInteriorBreaker', buildingId: 1, off: false }));
    expect(on).toEqual(factory(city()));
  });

  it('refuses a building with neither a Production interior nor a Venue', () => {
    const result = dispatch(city(), { type: 'SetInteriorBreaker', buildingId: 2, off: true }, 0);
    expect(result.ok).toBe(false);
  });
});

describe('the breaker of a Venue', () => {
  const venue = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 3)!;

  it('draws no power and shuts the Venue until it is switched back on', () => {
    const on = city();
    expect(economicPower(venue(on))).toBeGreaterThan(0);
    const off = send(on, { type: 'SetInteriorBreaker', buildingId: 3, off: true });
    expect(venue(off).breakerOff).toBe(true);
    expect(economicPower(venue(off))).toBe(0);
    expect(isVenuePowered(off, venue(off))).toBe(false);
    const back = send(off, { type: 'SetInteriorBreaker', buildingId: 3, off: false });
    expect(venue(back)).toEqual(venue(on));
  });
});
