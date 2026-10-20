import { describe, expect, it } from 'vitest';
import { advance, homeCauses, PETITION_CAUSES, POLITICS, SUPPORT_CAUSES, type GameState, type Petition } from '../index';
import { needsContext } from '../environment/needs';
import { DAY, politicalCity } from './testSupport';

const matured = (state: GameState): GameState => ({ ...state, adaptationUntil: 0 });

const petition = (overrides: Partial<Petition> = {}): Petition => ({ id: 1, cause: 'pollution', parcel: { x: 0, y: 0 }, since: 0, escalated: false, ...overrides });

const withPetitions = (state: GameState, petitions: Petition[]): GameState => ({ ...state, politics: { ...state.politics!, petitions, nextPetitionId: 10 } });

const nextDay = (state: GameState, days = 1): GameState => advance(state, state.lastSeen + days * DAY).state;

describe('Causes for complaint', () => {
  it('are the missing services and the shortage of power of a Home that has grown', () => {
    const city = matured(politicalCity());
    const home = city.buildings.find(building => building.type === 'home')!;
    const causes = homeCauses(city, home, needsContext(city));
    expect(causes.length).toBeGreaterThan(0);
    expect(causes).toContain('electricity');
    for (const cause of causes) expect(PETITION_CAUSES).toContain(cause);
  });
});

describe('Filing Petitions', () => {
  it('files none during the Adaptation period', () => {
    const city = politicalCity();
    expect(nextDay(city, 1).politics!.petitions).toEqual([]);
  });

  it('files Petitions that name a cause and the district of a Home, and keeps them below the cap', () => {
    let city = matured(politicalCity());
    for (let day = 0; day < 10; day++) city = nextDay(city);
    const { petitions } = city.politics!;
    expect(petitions.length).toBeGreaterThan(0);
    expect(petitions.length).toBeLessThanOrEqual(POLITICS.petitions.maxOpen);
    for (const open of petitions) {
      expect(PETITION_CAUSES).toContain(open.cause);
      expect(open.parcel).toEqual({ x: 0, y: 0 });
    }
    expect(new Set(petitions.map(open => open.cause)).size).toBe(petitions.length);
    expect(new Set(petitions.map(open => open.id)).size).toBe(petitions.length);
  });

  it('files the same Petitions for the same Seed', () => {
    const play = () => {
      let city = matured(politicalCity());
      for (let day = 0; day < 5; day++) city = nextDay(city);
      return city.politics!.petitions;
    };
    expect(play()).toEqual(play());
  });

  it('gives the same result in one go as in steps', () => {
    const base = matured(politicalCity());
    // The offline replay stops at two game days.
    const oneGo = nextDay(base, 2);
    const steps = nextDay(nextDay(base));
    expect(JSON.stringify(steps.politics)).toBe(JSON.stringify(oneGo.politics));
  });
});

describe('Handling Petitions', () => {
  const settled = (difficulty: 'easy' | 'medium') => matured(withPetitions(politicalCity(difficulty), [petition()]));

  it('closes a Petition whose cause is gone', () => {
    expect(nextDay(settled('medium')).politics!.petitions.filter(open => open.cause === 'pollution')).toEqual([]);
  });

  it('raises the Approval when a Petition is handled, from Medium', () => {
    const city = settled('medium');
    const after = nextDay(city).politics!;
    expect(after.shock).toBeCloseTo(city.politics!.shock * (1 - POLITICS.approval.shockFadePerDay) + POLITICS.approval.shocks.petitionHandled, 5);
  });

  it('only informs under Easy: handling a Petition changes no Approval', () => {
    const city = settled('easy');
    expect(nextDay(city).politics!.shock).toBeCloseTo(city.politics!.shock * (1 - POLITICS.approval.shockFadePerDay), 5);
  });
});

describe('Demonstrations', () => {
  const ignored = (difficulty: 'easy' | 'medium', since: number) => matured(withPetitions(politicalCity(difficulty), [petition({ cause: 'electricity', since })]));
  const today = (city: GameState) => city.politics!.day;

  it('escalate an ignored Petition from Medium and lower the Approval', () => {
    const city = ignored('medium', 0);
    const longIgnored = withPetitions({ ...city, politics: { ...city.politics!, adaptationUntilDay: 0 } }, [petition({ cause: 'electricity', since: today(city) - POLITICS.petitions.escalationDays })]);
    const after = nextDay(longIgnored).politics!;
    const escalated = after.petitions.find(open => open.cause === 'electricity');
    expect(escalated?.escalated).toBe(true);
    expect(after.shock).toBeCloseTo(longIgnored.politics!.shock * (1 - POLITICS.approval.shockFadePerDay) + POLITICS.approval.shocks.demonstration, 5);
  });

  it('wait for a Petition to be old enough', () => {
    const city = ignored('medium', 0);
    const fresh = withPetitions({ ...city, politics: { ...city.politics!, adaptationUntilDay: 0 } }, [petition({ cause: 'electricity', since: today(city) })]);
    expect(nextDay(fresh).politics!.petitions.find(open => open.cause === 'electricity')?.escalated).toBe(false);
  });

  it('never happen during the Adaptation period', () => {
    const city = ignored('medium', 0);
    const adapting = withPetitions({ ...city, politics: { ...city.politics!, adaptationUntilDay: today(city) + 10 } }, [petition({ cause: 'electricity', since: today(city) - 20 })]);
    expect(nextDay(adapting).politics!.petitions.find(open => open.cause === 'electricity')?.escalated).toBe(false);
  });

  it('never happen under Easy', () => {
    const city = ignored('easy', 0);
    const old = withPetitions({ ...city, politics: { ...city.politics!, adaptationUntilDay: 0 } }, [petition({ cause: 'electricity', since: today(city) - 20 })]);
    const after = nextDay(old).politics!;
    expect(after.petitions.find(open => open.cause === 'electricity')?.escalated).toBe(false);
    expect(after.shock).toBeCloseTo(old.politics!.shock * (1 - POLITICS.approval.shockFadePerDay), 5);
  });
});

describe('Support', () => {
  it('lasts a limited number of game days', () => {
    const city = politicalCity();
    const praised = { ...city, politics: { ...city.politics!, supports: [{ id: 1, cause: SUPPORT_CAUSES[0], parcel: { x: 0, y: 0 }, since: 0 }], nextPetitionId: 2 } };
    expect(nextDay(praised).politics!.supports.filter(support => support.id === 1)).toEqual([]);
  });
});

