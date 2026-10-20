import { describe, expect, it } from 'vitest';
import {
  OFFICE, OFFICE_TYPES, NATURE_TYPES, congestionStats, createBuilding, dispatch, energyStats, greenProfileOf, homeBenefits, homeTaxMultiplier, needsContext, needsPyramid, newGame, officeUrbsDue,
  utilityDemand, wasteReport, withPolitics, type Building, type Difficulty, type GameState, type OrdinanceId,
} from '../index';
import { WALKING } from '../traffic/walking';

const T0 = 1_700_000_000_000;
const ROAD_ROW_Y = 58;

function town(difficulty: Difficulty = 'easy'): GameState {
  const base = newGame({ seed: 'amber-fox-4821', now: T0, difficulty });
  const home: Building = { ...createBuilding(base.nextId, 'home', 56, ROAD_ROW_Y + 1, 0), tier: 3 };
  const hall = createBuilding(base.nextId + 1, 'townHall', 8, 8, 0);
  return withPolitics({ ...base, adaptationUntil: 0, nextId: base.nextId + 2, buildings: [...base.buildings, home, hall] });
}

const adopting = (state: GameState, ...ids: OrdinanceId[]): GameState => ({ ...state, politics: { ...state.politics!, adopted: ids } });

const homeOf = (state: GameState): Building => state.buildings.find(building => building.type === 'home')!;

describe('Ordinance effects', () => {
  const city = town();

  it('change nothing while no Ordinance is adopted', () => {
    expect(adopting(city)).toEqual(city);
  });

  it('change nothing under Cozy, even with an Ordinance in the save', () => {
    const cozy = { ...adopting(city, 'taxRelief'), difficulty: 'cozy' as const };
    expect(homeTaxMultiplier(cozy, homeOf(cozy), needsContext(cozy))).toBe(homeTaxMultiplier({ ...city, difficulty: 'cozy' }, homeOf(city), needsContext({ ...city, difficulty: 'cozy' })));
  });

  describe('taxMultiplier', () => {
    const multiplier = (state: GameState) => homeTaxMultiplier(state, homeOf(state), needsContext(state));

    it.each([['taxRelief', 0.9], ['taxIncrease', 1.15]] as const)('%s multiplies the Tax of every Home by %s', (id, factor) => {
      expect(multiplier(adopting(city, id))).toBeCloseTo(multiplier(city) * factor, 9);
    });
  });

  describe('wasteSorting', () => {
    it('lowers the Waste the Homes produce', () => {
      const produced = wasteReport(city).produced;
      expect(produced).toBeGreaterThan(0);
      expect(wasteReport(adopting(city, 'wasteSorting')).produced).toBeCloseTo(produced * 0.75, 9);
    });
  });

  describe('greenBelt', () => {
    const tree = NATURE_TYPES.find(type => greenProfileOf(type))!;
    const withTree = (state: GameState, x: number): GameState => ({ ...state, nextId: state.nextId + 1, buildings: [...state.buildings, createBuilding(state.nextId, tree, x, ROAD_ROW_Y + 1, 0)] });

    it('adds Well-being to a Home that has a Green space in reach', () => {
      const green = withTree(city, 58);
      const before = homeBenefits(green, homeOf(green)).wellbeing;
      expect(homeBenefits(adopting(green, 'greenBelt'), homeOf(green)).wellbeing).toBeCloseTo(before + 5, 5);
    });

    it('adds nothing to a Home without a Green space', () => {
      expect(homeBenefits(adopting(city, 'greenBelt'), homeOf(city)).wellbeing).toBe(homeBenefits(city, homeOf(city)).wellbeing);
    });
  });

  describe('transitSubsidy', () => {
    it('lowers the Congestion of a connected Home, and stops with the Ordinance', () => {
      WALKING.enabled = false;
      try {
        const connected = town();
        const ratio = congestionStats(connected).homes.get(homeOf(connected).id)!.ratio;
        expect(ratio).toBeGreaterThan(0);
        const subsidised = adopting(connected, 'transitSubsidy');
        expect(congestionStats(subsidised).homes.get(homeOf(connected).id)!.ratio).toBeCloseTo(ratio * 0.8, 9);
        expect(congestionStats({ ...subsidised, politics: { ...subsidised.politics!, adopted: [] } }).homes.get(homeOf(connected).id)!.ratio).toBeCloseTo(ratio, 9);
      } finally {
        WALKING.enabled = true;
      }
    });
  });

  describe('energySaving', () => {
    it('lowers the power Demand of the buildings', () => {
      const saving = adopting(city, 'energySaving');
      expect(energyStats(saving).demand).toBeCloseTo(energyStats(city).demand * 0.9, 9);
      expect(utilityDemand(saving).power).toBeCloseTo(utilityDemand(city).power * 0.9, 9);
    });
  });

  describe('officeRelief', () => {
    const officeType = OFFICE_TYPES[0]!;
    const withOffice = (state: GameState): GameState => ({
      ...state,
      nextId: state.nextId + 1,
      buildings: [...state.buildings, { ...createBuilding(state.nextId, officeType, 20, 20, 0), taxCitizenMs: 100 * OFFICE.hourMs / OFFICE.urbsPerJobPerHour }],
    });
    const officeOf = (state: GameState) => state.buildings.find(building => building.type === officeType)!;

    it('raises the Urbs the Jobs earn, and collects exactly what is shown', () => {
      const relief = adopting(withOffice(city), 'officeRelief');
      const shown = officeUrbsDue(officeOf(relief), 1.15);
      expect(shown).toBeGreaterThan(officeUrbsDue(officeOf(relief)));
      const result = dispatch(relief, { type: 'Collect', buildingId: officeOf(relief).id }, T0);
      if (!result.ok) throw new Error(result.error.key);
      expect(result.state.urbs).toBeCloseTo(relief.urbs + shown, 5);
      expect(officeUrbsDue(officeOf(result.state), 1.15)).toBeLessThanOrEqual(1);
    });

    it('pays the usual amount without the Ordinance', () => {
      const plain = withOffice(city);
      const result = dispatch(plain, { type: 'Collect', buildingId: officeOf(plain).id }, T0);
      if (!result.ok) throw new Error(result.error.key);
      expect(result.state.urbs).toBeCloseTo(plain.urbs + officeUrbsDue(officeOf(plain)), 5);
    });
  });

  describe('culturalFestival', () => {
    const esteem = (state: GameState) => needsPyramid(state).levels.find(level => level.id === 'esteem')!.satisfaction!;

    it('raises the Esteem Need level', () => {
      expect(esteem(adopting(city, 'culturalFestival'))).toBeCloseTo(Math.min(100, esteem(city) + 8), 9);
    });
  });

  it('ends the moment the Ordinance is repealed', () => {
    const multiplier = (state: GameState) => homeTaxMultiplier(state, homeOf(state), needsContext(state));
    const relief = adopting(city, 'taxRelief');
    const repealed = dispatch(relief, { type: 'RepealOrdinance', id: 'taxRelief' }, T0);
    if (!repealed.ok) throw new Error(repealed.error.key);
    expect(multiplier(repealed.state)).toBeCloseTo(multiplier(city), 9);
  });
});
