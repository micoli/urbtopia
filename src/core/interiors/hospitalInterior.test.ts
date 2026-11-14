import { describe, expect, it } from 'vitest';
import { avatarsOfBuilding, createBuilding, dispatch, interiorKindOf, interiorPostsOf, newGame, serviceFurnitureQuality, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { careWellbeingOf } from './serviceInterior';
import { homeBenefits } from '../environment/wellbeing';
import { serviceCoverage } from '../services/services';
import { congestionStats } from '../traffic/congestion';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { energyStats } from '../environment/energy';

// A Hospital at (55, 50) with a Home beside it, and enough Citizens elsewhere for the interior to open.
const city = (tier = 5, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'hospital-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  adaptationUntil: 0,
  buildings: [{ ...createBuilding(1, 'hospital', 55, 50, 0), tier }, { ...createBuilding(10, 'home', 58, 50, 0), tier: 6 },
    ...[11, 12, 13, 14, 15].map(id => ({ ...createBuilding(id, 'home', 20 + id, 20, 0), tier: 6 }))],
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
const hospital = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const hire = (role: 'nurse' | 'doctor' | 'surgeon'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const furnished = [place('hospitalBed', 1, 1), place('hospitalBed', 2, 1), place('hospitalVitalsMonitor', 1, 3), place('hospitalOperatingTable', 3, 3), place('hospitalMedicineCabinet', 4, 0)];

describe('the Hospital interior', () => {
  it('is a Service interior of its own kind that takes its own furniture', () => {
    expect(interiorKindOf(hospital(city()))).toBe('hospital');
    expect(failure(city(), place('libraryChair', 1, 1))).toBe('error.unknownCommand');
    expect(hospital(apply(city(), ...furnished)).interior?.fixtures).toHaveLength(5);
  });

  it('opens its posts by Tier: a nurse first, then a doctor, then a surgeon', () => {
    expect(interiorPostsOf('hospital', 'nurse', 1)).toBeGreaterThan(0);
    expect(interiorPostsOf('hospital', 'doctor', 1)).toBe(0);
    expect(interiorPostsOf('hospital', 'surgeon', 2)).toBe(0);
    expect(failure(city(1), hire('doctor'))).toBe('error.tierTooLow');
    expect(failure(city(2), hire('surgeon'))).toBe('error.tierTooLow');
    expect(hospital(apply(city(3), hire('surgeon'))).interior?.staff).toEqual({ surgeon: 1 });
  });

  it('adds care with the furniture and each role, a part each', () => {
    const fitted = apply(city(), ...furnished);
    expect(serviceFurnitureQuality(hospital(fitted))).toBeGreaterThan(0);
    const care = (state: GameState) => careWellbeingOf(state, hospital(state), null);
    expect(care(fitted)).toBe(0);
    const nursed = apply(fitted, hire('nurse'));
    expect(care(nursed)).toBeGreaterThan(0);
    const treated = apply(nursed, hire('doctor'));
    expect(care(treated)).toBeGreaterThan(care(nursed));
    const operated = apply(treated, hire('surgeon'));
    expect(care(operated)).toBeGreaterThan(care(treated));
    expect(care(apply(city(), hire('nurse'), hire('doctor'), hire('surgeon')))).toBe(0);
  });

  it('raises the Well-being of a Home it serves', () => {
    // Nobody commutes in this city, so no Staff would be filled: the Adaptation period counts them all at work.
    const benefits = (given: GameState) => {
      const state = { ...given, adaptationUntil: 1e15 };
      const home = state.buildings.find(candidate => candidate.id === 10)!;
      return homeBenefits(state, home, energyStats(state).coalRates, serviceCoverage(state), poweredCasinoIds(state), congestionStats(state)).wellbeing;
    };
    const bare = city();
    const staffed = apply(city(), ...furnished, hire('nurse'), hire('doctor'), hire('surgeon'));
    expect(benefits(staffed)).toBeGreaterThan(benefits(bare));
    expect(benefits(apply(city(), ...furnished))).toBe(benefits(bare));
  });
});

describe('Hospital avatars', () => {
  it('shows each hired role as an avatar in costume beside the Fixtures of their post', () => {
    const building = { ...hospital(city()), interior: { staff: { nurse: 2, doctor: 1 } } } as Building;
    const avatars = avatarsOfBuilding(building);
    expect(avatars.map(avatar => avatar.count)).toEqual([2, 1]);
    expect(avatars[0]!.beside).toContain('hospitalBed');
    expect(avatars.map(avatar => avatar.model)).toEqual(['hospital-interior/character-nurse', 'hospital-interior/character-doctor']);
  });

  it('shows nobody while no Staff is hired', () => {
    expect(avatarsOfBuilding(hospital(city()))).toEqual([]);
  });
});
