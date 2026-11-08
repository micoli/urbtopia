import { describe, expect, it } from 'vitest';
import { citizensOf, congestionStats, createBuilding, homeBenefits, needsPyramid, newGame, type Building, type GameState } from '../index';
import { unemploymentPenaltyOf } from './wellbeing';
import { UNEMPLOYMENT } from '../traffic/roadTier';

// A big Home next to an Office: the Office's tier decides whether its Jobs are enough for the Home's Citizens.
const home = (): Building => ({ ...createBuilding(901, 'home', 55, 59, 0), tier: 4 });
const office = (tier: number): Building => ({ ...createBuilding(900, 'office', 60, 59, 0), tier });
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({ ...newGame({ seed: 'unemployment', now: 0 }), tutorial: null, adaptationUntil: 0, buildings, ...extra });
const penaltyOf = (state: GameState) => homeBenefits(state, state.buildings.find(building => building.id === 901)!).unemploymentPenalty;

describe('unemployment penalty', () => {
  it('is none up to the tolerance, then linear to the cap', () => {
    expect(unemploymentPenaltyOf(0)).toBe(0);
    expect(unemploymentPenaltyOf(UNEMPLOYMENT.tolerance)).toBe(0);
    expect(unemploymentPenaltyOf(1)).toBe(UNEMPLOYMENT.maxPenalty);
    expect(unemploymentPenaltyOf((1 + UNEMPLOYMENT.tolerance) / 2)).toBeCloseTo(UNEMPLOYMENT.maxPenalty / 2);
  });

  it('docks a Home whose Citizens do not all find a Job', () => {
    const state = city([home(), office(1)]);
    const unemployed = congestionStats(state).homes.get(901)!.unemployed;
    expect(unemployed).toBeGreaterThan(0);
    expect(penaltyOf(state)).toBeCloseTo(unemploymentPenaltyOf(unemployed / citizensOf(4)));
    expect(penaltyOf(state)).toBeGreaterThan(0);
  });

  it('leaves a Home whose Citizens all find a Job alone, and lowers Well-being by the penalty otherwise', () => {
    const employed = city([home(), office(4)]);
    const jobless = city([home(), office(1)]);
    expect(penaltyOf(employed)).toBe(0);
    const bare = (state: GameState) => homeBenefits(state, state.buildings.find(building => building.id === 901)!).wellbeing;
    expect(bare(employed) - bare(jobless)).toBeCloseTo(penaltyOf(jobless));
  });

  it('is not charged during an Adaptation period', () => {
    expect(penaltyOf(city([home(), office(1)], { adaptationUntil: Number.MAX_SAFE_INTEGER }))).toBe(0);
  });

  it('feeds the Employment Need factor of the Safety level, which has no Sanction', () => {
    const factor = (state: GameState) => needsPyramid(state).levels.find(level => level.id === 'safety')!.factors.find(entry => entry.id === 'employment')!;
    expect(factor(city([home(), office(1)])).satisfaction).toBeLessThan(100);
    expect(factor(city([home(), office(4)])).satisfaction).toBe(100);
    expect(factor(city([home(), office(1)])).effects).toEqual(['wellbeing']);
  });
});
