import { describe, expect, it } from 'vitest';
import { adoptedOrdinances, advance, approvalOf, councilForecast, dispatch, FACTION_IDS, ORDINANCE_ENTRIES, POLITICS, proposalIssue, type Command, type GameState, type OrdinanceId } from '../index';
import { DAY, T0, politicalCity, withApproval } from './testSupport';

function run(state: GameState, command: Command, now = T0) {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result;
}

const propose = (state: GameState, id: OrdinanceId, now = T0) => run(state, { type: 'ProposeOrdinance', id }, now);
const refusal = (state: GameState, command: Command, now = T0) => {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
};

describe('Council forecast', () => {
  const city = politicalCity();

  it('seats every Faction', () => {
    expect(councilForecast(city, 'greenBelt').votes.map(vote => vote.faction)).toEqual([...FACTION_IDS]);
    expect(councilForecast(city, 'greenBelt').seats).toBe(9);
  });

  it('passes an Ordinance that most of the seats welcome', () => {
    const forecast = councilForecast(city, 'transitSubsidy');
    expect(forecast.seatsFor).toBe(9);
    expect(forecast.passes).toBe(true);
  });

  it('rejects an Ordinance that only one Faction welcomes', () => {
    const forecast = councilForecast(city, 'taxRelief');
    expect(forecast.votes.filter(vote => vote.vote === 'for').map(vote => vote.faction)).toEqual(['economy']);
    expect(forecast.passes).toBe(false);
  });

  it('counts a neutral stance as against', () => {
    expect(councilForecast(city, 'greenBelt').votes.find(vote => vote.faction === 'services')!.vote).toBe('against');
  });

  it('ignores the Approval under Easy and Medium', () => {
    for (const difficulty of ['easy', 'medium'] as const) {
      const base = politicalCity(difficulty);
      expect(councilForecast(withApproval(base, 100), 'greenBelt')).toEqual(councilForecast(withApproval(base, 0), 'greenBelt'));
    }
  });

  it('lets the Approval sway the Council under Hard', () => {
    const hard = politicalCity('hard');
    expect(councilForecast(withApproval(hard, 100), 'greenBelt').passes).toBe(true);
    expect(councilForecast(withApproval(hard, 0), 'wasteSorting').passes).toBe(false);
    expect(councilForecast(withApproval(hard, 50), 'wasteSorting').passes).toBe(true);
  });
});

describe('Proposing an Ordinance', () => {
  const city = politicalCity();

  it('adopts an Ordinance the forecast passes', () => {
    const result = propose(city, 'transitSubsidy');
    expect(adoptedOrdinances(result.state)).toEqual(['transitSubsidy']);
    expect(result.events).toContainEqual({ type: 'OrdinanceAdopted', id: 'transitSubsidy' });
  });

  it('follows the forecast exactly', () => {
    for (const { id } of ORDINANCE_ENTRIES) {
      const ready = { ...city, politics: city.politics! };
      if (proposalIssue(ready, id) !== null) continue;
      const adopted = adoptedOrdinances(propose(ready, id).state).includes(id);
      expect(adopted).toBe(councilForecast(ready, id).passes);
    }
  });

  it('raises the Approval when an Ordinance is adopted', () => {
    const before = approvalOf(city)!;
    expect(approvalOf(propose(city, 'transitSubsidy').state)).toBe(before + POLITICS.approval.shocks.ordinanceAdopted);
  });

  it('rejects an Ordinance the forecast fails, and makes the Mayor wait', () => {
    expect(councilForecast(city, 'officeRelief').passes).toBe(false);
    const rejected = propose(city, 'officeRelief');
    expect(rejected.events).toContainEqual({ type: 'OrdinanceRejected', id: 'officeRelief' });
    expect(adoptedOrdinances(rejected.state)).toEqual([]);
    expect(refusal(rejected.state, { type: 'ProposeOrdinance', id: 'officeRelief' })).toBe('error.ordinanceWaiting');
  });

  it('allows a second proposal once the delay has passed', () => {
    const rejected = propose(city, 'officeRelief').state;
    const days = POLITICS.council.reproposeDelayDays;
    expect(refusal(rejected, { type: 'ProposeOrdinance', id: 'officeRelief' }, T0 + (days - 1) * DAY)).toBe('error.ordinanceWaiting');
    expect(refusal(rejected, { type: 'ProposeOrdinance', id: 'officeRelief' }, T0 + days * DAY)).toBeNull();
  });

  it('refuses an Ordinance that is already adopted', () => {
    const adopted = propose(city, 'transitSubsidy').state;
    expect(refusal(adopted, { type: 'ProposeOrdinance', id: 'transitSubsidy' })).toBe('error.ordinanceAdopted');
  });

  it('refuses an unknown Ordinance', () => {
    expect(refusal(city, { type: 'ProposeOrdinance', id: 'martialLaw' })).toBe('error.unknownOrdinance');
  });

  it('refuses an Ordinance the city is too small for', () => {
    const small = { ...city, buildings: city.buildings.map(building => (building.type === 'home' ? { ...building, tier: 1 } : building)) };
    expect(refusal(small, { type: 'ProposeOrdinance', id: 'culturalFestival' })).toBe('error.ordinanceLocked');
  });

  it('refuses an Ordinance whose exclusive group is already taken', () => {
    const relief = propose(withApproval({ ...city, politics: { ...city.politics!, seats: { economy: 9, environment: 0, services: 0 } } }, 50), 'taxRelief').state;
    expect(adoptedOrdinances(relief)).toEqual(['taxRelief']);
    expect(refusal(relief, { type: 'ProposeOrdinance', id: 'taxIncrease' })).toBe('error.ordinanceExcluded');
  });

  it('is refused without politics', () => {
    const cozy = politicalCity();
    expect(refusal({ ...cozy, difficulty: 'cozy' }, { type: 'ProposeOrdinance', id: 'transitSubsidy' })).toBe('error.politicsInactive');
  });
});

describe('Repealing an Ordinance', () => {
  const adopted = propose(politicalCity(), 'transitSubsidy').state;

  it('needs no vote', () => {
    const result = run(adopted, { type: 'RepealOrdinance', id: 'transitSubsidy' });
    expect(adoptedOrdinances(result.state)).toEqual([]);
    expect(result.events).toContainEqual({ type: 'OrdinanceRepealed', id: 'transitSubsidy' });
  });

  it('costs Approval when the Ordinance was popular', () => {
    const before = approvalOf(adopted)!;
    expect(approvalOf(run(adopted, { type: 'RepealOrdinance', id: 'transitSubsidy' }).state)).toBe(before + POLITICS.approval.shocks.popularOrdinanceRepealed);
  });

  it('costs nothing when the Ordinance was unpopular', () => {
    const unpopular = propose(politicalCity(), 'wasteSorting').state;
    const before = approvalOf(unpopular)!;
    expect(approvalOf(run(unpopular, { type: 'RepealOrdinance', id: 'wasteSorting' }).state)).toBe(before);
  });

  it('refuses an Ordinance that is not adopted', () => {
    expect(refusal(politicalCity(), { type: 'RepealOrdinance', id: 'transitSubsidy' })).toBe('error.unknownOrdinance');
  });
});

describe('Upkeep', () => {
  const adopted = propose(politicalCity(), 'transitSubsidy').state;
  const upkeep = ORDINANCE_ENTRIES.find(entry => entry.id === 'transitSubsidy')!.upkeepPerDay;

  it('is debited once a game day', () => {
    const noUpkeep = advance(politicalCity(), T0 + DAY).state.urbs;
    const withUpkeep = advance(adopted, T0 + DAY).state.urbs;
    expect(noUpkeep - withUpkeep).toBeGreaterThan(0);
    expect(advance(adopted, T0 + DAY / 2).state.politics!.adopted).toEqual(['transitSubsidy']);
  });

  it('is debited for every day played, in one go or in steps', () => {
    const oneGo = advance(adopted, T0 + 2 * DAY).state;
    const steps = advance(advance(adopted, T0 + DAY / 2).state, T0 + 2 * DAY).state;
    expect(steps.urbs).toBeCloseTo(oneGo.urbs, 5);
    expect(steps.politics).toEqual(oneGo.politics);
    expect(advance(politicalCity(), T0 + 2 * DAY).state.urbs - oneGo.urbs).toBeCloseTo(2 * upkeep, 5);
  });

  it('lets an Ordinance lapse when its upkeep cannot be paid', () => {
    const broke = { ...adopted, urbs: 0 };
    expect(advance(broke, T0 + DAY).state.politics!.adopted).toEqual([]);
  });
});
