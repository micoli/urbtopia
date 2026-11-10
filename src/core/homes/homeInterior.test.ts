import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { homeBenefits } from '../environment/wellbeing';
import { comfortBonusOf, comfortCoverageOf, comfortOf, homeFixtureRefund, homeGridSizeOf, homeWellbeingCapOf } from './homeInterior';
import { FIXTURES } from '../venues/fixtures';

const city = (tier = 1, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'home-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'home', 55, 50, 0), tier }, createBuilding(2, 'arcade', 60, 50, 0)],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const home = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0, buildingId = 1): Command => ({ type: 'PlaceFloorFixture', buildingId, fixture, x, y, rotation });
const fixture = (type: FixtureId, x: number, y: number, id = 1): VenueFixture => ({ id, type, x, y, rotation: 0 });

describe('the Comfort of a Home interior', () => {
  it('is zero for an empty interior', () => {
    expect(comfortOf([])).toBe(0);
  });

  it('counts a table only with a chair next to it', () => {
    expect(comfortCoverageOf([fixture('homeTable', 0, 0)]).eating).toBe(0);
    expect(comfortCoverageOf([fixture('homeTable', 0, 0), fixture('homeChair', 1, 0, 2)]).eating).toBe(1);
    expect(comfortCoverageOf([fixture('homeTable', 0, 0), fixture('homeChair', 3, 3, 2)]).eating).toBe(0);
  });

  it('covers cooking with a stove and a sink, half each', () => {
    expect(comfortCoverageOf([fixture('homeStove', 0, 0)]).cooking).toBe(0.5);
    expect(comfortCoverageOf([fixture('homeStove', 0, 0), fixture('homeSink', 1, 0, 2)]).cooking).toBe(1);
  });

  it('covers washing with a shower or a bathtub and a toilet, half each', () => {
    expect(comfortCoverageOf([fixture('homeBathtub', 0, 0)]).washing).toBe(0.5);
    expect(comfortCoverageOf([fixture('homeShower', 0, 0), fixture('homeToilet', 1, 0, 2)]).washing).toBe(1);
  });

  it('covers leisure with a television alone, and adds up lesser pieces', () => {
    expect(comfortCoverageOf([fixture('homeTelevision', 0, 0)]).leisure).toBe(1);
    expect(comfortCoverageOf([fixture('homeArmchair', 0, 0)]).leisure).toBe(0.5);
    expect(comfortCoverageOf([fixture('homeArmchair', 0, 0), fixture('homeBookcase', 1, 0, 2)]).leisure).toBe(1);
  });

  it('gives decor diminishing returns', () => {
    const pieces = Array.from({ length: 6 }, (_, index) => fixture('homePlant', index, 0, index + 1));
    const decorOf = (count: number): number => comfortCoverageOf(pieces.slice(0, count)).decor;
    const [one, three, six] = [decorOf(1), decorOf(3), decorOf(6)] as const;
    expect(one).toBeLessThan(three);
    expect(three - one).toBeGreaterThan(six - three - 0.2);
    expect(six).toBeLessThan(1);
  });

  it('weighs the groups of a full dwelling to 100', () => {
    const full = [fixture('homeBed', 0, 0, 1), fixture('homeShower', 2, 0, 2), fixture('homeToilet', 3, 0, 3), fixture('homeTable', 0, 3, 4), fixture('homeChair', 1, 3, 5),
      fixture('homeStove', 2, 3, 6), fixture('homeSink', 3, 3, 7), fixture('homeTelevision', 1, 1, 8)].concat(Array.from({ length: 12 }, (_, index) => fixture('homePlant', 0, 0, 20 + index)));
    expect(comfortOf(full)).toBeGreaterThan(95);
    expect(comfortOf(full)).toBeLessThanOrEqual(100);
  });

  it('caps its Well-being bonus by the Tier of the Home', () => {
    const base = { ...createBuilding(1, 'home', 0, 0, 0), floor: { fixtures: [fixture('homeBed', 0, 0)], nextFixtureId: 2 } };
    expect(comfortBonusOf(base)).toBeCloseTo(homeWellbeingCapOf(1) * 0.25);
    expect(comfortBonusOf({ ...base, floor: undefined })).toBe(0);
    expect(homeWellbeingCapOf(1)).toBe(5);
    expect(homeWellbeingCapOf(8)).toBe(12);
  });
});

describe('furnishing a Home', () => {
  it('starts with no interior and puts the Fixture on a new one, for a price', () => {
    expect(home(city()).floor).toBeUndefined();
    const state = send(city(), place('homeBed', 0, 1));
    expect(home(state).floor?.fixtures).toEqual([{ id: 1, type: 'homeBed', x: 0, y: 1, rotation: 0 }]);
    expect(state.urbs).toBe(100_000 - FIXTURES.homeBed.price);
  });

  it('leaves the Home as it was apart from its interior', () => {
    const before = home(city());
    const after = home(send(city(), place('homeBed', 0, 1)));
    expect({ ...after, floor: undefined }).toEqual({ ...before, floor: undefined });
  });

  it('only takes Home Fixtures, and only in a Home', () => {
    expect(failure(city(), place('factoryMotor', 0, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('chair', 0, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('homeBed', 0, 1, 0, 2))).toBe('error.unknownBuilding');
  });

  it('keeps Fixtures inside the grid of the Tier and apart from each other', () => {
    expect(failure(city(), place('homeChair', homeGridSizeOf(1), 1))).toBe('error.tilesOccupied');
    const state = send(city(), place('homeChair', 1, 1));
    expect(failure(state, place('homeChair', 1, 1))).toBe('error.tilesOccupied');
  });

  it('refuses a Fixture the Tier does not unlock', () => {
    expect(failure(city(1), place('homeDoubleBed', 0, 1))).toBe('error.tierTooLow');
    expect(send(city(2), place('homeDoubleBed', 0, 1))).toBeDefined();
  });

  it('refuses without the Urbs', () => {
    expect(failure(city(1, 0), place('homeBed', 0, 1))).toBe('error.notEnoughUrbs');
  });

  it('moves and removes a Fixture, refunding half its price', () => {
    let state = send(city(), place('homeBed', 0, 1));
    state = send(state, { type: 'MoveFloorFixture', buildingId: 1, fixtureId: 1, x: 2, y: 1 });
    expect(home(state).floor?.fixtures[0]).toMatchObject({ x: 2, y: 1 });
    const urbs = state.urbs;
    state = send(state, { type: 'RemoveFloorFixture', buildingId: 1, fixtureId: 1 });
    expect(home(state).floor?.fixtures).toEqual([]);
    expect(state.urbs).toBe(urbs + homeFixtureRefund('homeBed'));
    expect(homeFixtureRefund('homeBed')).toBe(FIXTURES.homeBed.price / 2);
  });

  it('keeps its interior through a Tier upgrade', () => {
    const state = send(city(), place('homeBed', 0, 1));
    const upgraded = { ...state, buildings: state.buildings.map(building => (building.id === 1 ? { ...building, tier: 2 } : building)) };
    expect(home(upgraded).floor?.fixtures).toHaveLength(1);
  });
});

describe('the Well-being of a furnished Home', () => {
  const furnished = (state: GameState): GameState => ['homeBed', 'homeTelevision'].reduce((current, type, index) => send(current, place(type as FixtureId, index * 2, 1)), state);

  it('is raised by Comfort and never lowered by an empty interior', () => {
    const empty = homeBenefits(city(), home(city()));
    const full = furnished(city());
    const benefits = homeBenefits(full, home(full));
    expect(benefits.comfortBonus).toBeGreaterThan(0);
    expect(benefits.wellbeing).toBeGreaterThanOrEqual(empty.wellbeing);
    expect(empty.comfortBonus).toBe(0);
  });
});

describe('the cost of the Comfort', () => {
  it('is computed once for as long as the interior does not change', () => {
    const fixtures = [fixture('homeBed', 0, 0)];
    expect(comfortCoverageOf(fixtures)).toBe(comfortCoverageOf(fixtures));
    expect(comfortOf(fixtures)).toBe(comfortOf(fixtures));
    expect(comfortCoverageOf([...fixtures])).not.toBe(comfortCoverageOf(fixtures));
  });
});
