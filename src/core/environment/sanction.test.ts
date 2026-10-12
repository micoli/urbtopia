import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { COAL_CAPACITY, SANCTIONS, advance, createBuilding, difficultyOf, homeBenefits, homePower, homeSanction, homeTaxMultiplier, needsContext, newGame, sanctionAlertKey, sanctionedHomes, taxLostPerHour, citizensOf, TAX, wellbeingTaxFactor, type Building, type Difficulty, type GameState } from '../index';
import { withAllServices } from '../engine/testSupport';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;
const SPOT = { x: 56, y: 59 };

interface Setup {
  difficulty?: Difficulty;
  services?: boolean;
  water?: boolean;
  power?: number;
  coal?: boolean;
  park?: boolean;
  adapting?: boolean;
}

function scenario({ difficulty = 'easy', services = true, water = true, power = 1, coal = false, park = false, adapting = false }: Setup = {}) {
  let state: GameState = { ...newGame({ seed: 'sanction', now: NOW }), difficulty, adaptationUntil: adapting ? NOW + 24 * HOUR : 0 };
  const home: Building = { ...createBuilding(state.nextId, 'home', SPOT.x, SPOT.y, 0), tier: 2 };
  state = { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, home] };
  if (services) state = withAllServices(state, SPOT);
  if (water) state = { ...state, buildings: [...state.buildings, { ...createBuilding(state.nextId, 'waterTower', 70, 70, 0), tier: 3 }], nextId: state.nextId + 1 };
  if (park) state = { ...state, buildings: [...state.buildings, createBuilding(state.nextId, 'park', SPOT.x + 2, SPOT.y + 2, 0)], nextId: state.nextId + 1 };
  const plant = coal ? createBuilding(state.nextId, 'coalPlant', SPOT.x + 1, SPOT.y + 1, 0) : null;
  if (plant) state = { ...state, buildings: [...state.buildings, plant], nextId: state.nextId + 1 };
  const base = needsContext(state);
  const context = {
    ...base,
    energy: {
      ...base.energy,
      supplied: new Map(base.energy.supplied).set(home.id, homePower(home) * power),
      coalRates: plant ? new Map([[plant.id, COAL_CAPACITY[0] ?? 0]]) : base.energy.coalRates,
    },
  };
  return { state, home, context };
}

describe('Sanction of a Home', () => {
  it('is nil for a well-served Home, whatever the Difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const { state, home, context } = scenario({ difficulty, park: true });
      expect(homeSanction(state, home, context)).toMatchObject({ factor: null, multiplier: 1 });
    }
  });

  it('sanctions Climate under Hard only for a Home with no Green space in reach', () => {
    const bare = scenario({ difficulty: 'hard' });
    const shaded = scenario({ difficulty: 'hard', park: true });
    expect(homeSanction(bare.state, bare.home, bare.context)).toMatchObject({ factor: 'climate' });
    expect(homeSanction(shaded.state, shaded.home, shaded.context).factor).toBeNull();
    const medium = scenario({ difficulty: 'medium' });
    expect(homeSanction(medium.state, medium.home, medium.context).factor).toBeNull();
  });

  it('is nil under Cozy even when nothing is served', () => {
    const { state, home, context } = scenario({ difficulty: 'cozy', services: false, water: false, power: 0 });
    expect(homeSanction(state, home, context)).toMatchObject({ factor: null, multiplier: 1 });
  });

  it('halves the Tax of a Home with no Safety and no Health coverage', () => {
    const { state, home, context } = scenario({ services: false });
    expect(homeSanction(state, home, context)).toMatchObject({ factor: 'safety', satisfaction: 0, multiplier: SANCTIONS.easy.taxFloor });
  });

  it('follows the lack of electricity continuously', () => {
    const { state, home, context } = scenario({ power: 0.5 });
    const sanction = homeSanction(state, home, context);
    expect(sanction.factor).toBe('electricity');
    expect(sanction.satisfaction).toBeCloseTo(50);
    expect(sanction.multiplier).toBeCloseTo((1 + SANCTIONS.easy.taxFloor) / 2);
  });

  it('follows the lack of water', () => {
    const { state, home, context } = scenario({ water: false });
    expect(homeSanction(state, home, context)).toMatchObject({ factor: 'water', satisfaction: 0, multiplier: SANCTIONS.easy.taxFloor });
  });

  it('takes the weakest factor only', () => {
    const { state, home, context } = scenario({ services: false, power: 0.5 });
    expect(homeSanction(state, home, context)).toMatchObject({ factor: 'safety', multiplier: SANCTIONS.easy.taxFloor });
  });

  it('never goes below the floor of the Difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const { state, home, context } = scenario({ difficulty, services: false, water: false, power: 0, coal: true });
      expect(homeSanction(state, home, context).multiplier).toBeGreaterThanOrEqual(SANCTIONS[difficulty].taxFloor);
    }
  });

  it('is suspended during the Adaptation period', () => {
    const { state, home, context } = scenario({ services: false, adapting: true });
    expect(homeSanction(state, home, context)).toMatchObject({ factor: null, multiplier: 1 });
  });

  it('ignores Pollution under Easy and sanctions it from Medium', () => {
    const easy = scenario({ difficulty: 'easy', coal: true });
    const medium = scenario({ difficulty: 'medium', coal: true });
    expect(homeSanction(easy.state, easy.home, easy.context).factor).toBeNull();
    const sanction = homeSanction(medium.state, medium.home, medium.context);
    expect(sanction.factor).toBe('pollution');
    expect(sanction.multiplier).toBeLessThan(1);
    expect(sanction.multiplier).toBeGreaterThanOrEqual(SANCTIONS.medium.taxFloor);
  });
});

describe('Tax multiplier of a Home', () => {
  it('keeps the previous rule under Cozy: power received times the Well-being factor', () => {
    const { state, home, context } = scenario({ difficulty: 'cozy', services: false, coal: true, power: 0.5 });
    const wellbeing = homeBenefits(state, home, context.energy.coalRates, context.coverage, context.poweredCasinos, context.congestion).wellbeing;
    expect(wellbeing).toBeLessThan(0);
    expect(homeTaxMultiplier(state, home, context)).toBeCloseTo(0.5 * wellbeingTaxFactor(wellbeing));
  });

  it('keeps the Well-being bonus above 1 from Easy', () => {
    const { state, home, context } = scenario({ difficulty: 'easy' });
    expect(homeTaxMultiplier(state, home, context)).toBeGreaterThanOrEqual(1);
  });

  it('no longer lets a negative Well-being lower the Tax from Easy: only the Sanction does', () => {
    const { state, home, context } = scenario({ difficulty: 'easy', services: false, coal: true });
    const wellbeing = homeBenefits(state, home, context.energy.coalRates, context.coverage, context.poweredCasinos, context.congestion).wellbeing;
    expect(wellbeing).toBeLessThan(0);
    expect(homeTaxMultiplier(state, home, context)).toBeCloseTo(SANCTIONS.easy.taxFloor);
  });

  it('is lowered by a missing Safety service from Easy on, never under Cozy once powered', () => {
    const cozy = scenario({ difficulty: 'cozy', services: false });
    const easy = scenario({ difficulty: 'easy', services: false });
    expect(homeTaxMultiplier(easy.state, easy.home, easy.context)).toBeCloseTo(0.5);
    expect(homeTaxMultiplier(cozy.state, cozy.home, cozy.context)).toBeGreaterThan(0.5);
  });
});

describe('Tax over time', () => {
  const taxCitizenMs = (state: GameState) => advance(state, state.lastSeen + 2 * HOUR).state.buildings.find(({ type }) => type === 'home')?.taxCitizenMs ?? 0;

  it('accrues half as fast for a Home with no services from Easy, with the Difficulty kept', () => {
    const served = scenario({ difficulty: 'easy' }).state;
    const unserved = scenario({ difficulty: 'easy', services: false }).state;
    expect(difficultyOf(advance(unserved, unserved.lastSeen + HOUR).state)).toBe('easy');
    expect(taxCitizenMs(unserved)).toBeLessThan(taxCitizenMs(served));
  });
});

describe('Sanctioned Homes', () => {
  it('lists no Home under Cozy, however neglected', () => {
    const { state } = scenario({ difficulty: 'cozy', services: false, water: false });
    expect(sanctionedHomes(state)).toEqual([]);
  });

  it('lists a neglected Home with its Sanction from Easy', () => {
    const { state, home } = scenario({ difficulty: 'easy', services: false });
    const listed = sanctionedHomes(state);
    expect(listed.map(entry => entry.home.id)).toEqual([home.id]);
    expect(listed[0]!.sanction.factor).not.toBeNull();
  });

  it('lists no Home during the Adaptation period', () => {
    const { state } = scenario({ difficulty: 'easy', services: false, adapting: true });
    expect(sanctionedHomes(state)).toEqual([]);
  });

  it('refreshes its alert key with the Difficulty, the minute and the buildings, but not with every tick', () => {
    const { state } = scenario({ difficulty: 'easy' });
    expect(sanctionAlertKey({ ...state, lastSeen: state.lastSeen + 1_000 })).toBe(sanctionAlertKey(state));
    expect(sanctionAlertKey({ ...state, lastSeen: state.lastSeen + 120_000 })).not.toBe(sanctionAlertKey(state));
    expect(sanctionAlertKey({ ...state, difficulty: 'hard' })).not.toBe(sanctionAlertKey(state));
    expect(sanctionAlertKey({ ...state, buildings: state.buildings.slice(1) })).not.toBe(sanctionAlertKey(state));
  });
});

describe('Tax lost to a Sanction', () => {
  it('is the Tax a Home would pay per hour times the share the Sanction takes', () => {
    const { state, home } = scenario({ difficulty: 'easy', services: false });
    const [entry] = sanctionedHomes(state);
    expect(entry!.home.id).toBe(home.id);
    expect(taxLostPerHour(entry!)).toBeCloseTo(citizensOf(home.tier) * TAX.urbsPerCitizenPerHour * (1 - entry!.sanction.multiplier));
    expect(taxLostPerHour(entry!)).toBeGreaterThan(0);
  });
});
