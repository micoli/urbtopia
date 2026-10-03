import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, cityBenefits, COAL_CAPACITY, createBuilding, dispatch, ECOLOGY, energyStats, footprintOf, homeBenefits, newGame, taxDue, type Building, type GameState } from '../index';

const H = ECOLOGY.hourMs;
const building = (id: number, type: Building['type'], x = 0, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, 0, 0), ...extra });
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'coal', now: 0 }), buildings, nextId: 100, urbs: 10000, tutorial: null, roads: [], adaptationUntil: 0, ...extra,
});

describe('coal construction and controls', () => {
  it('offers a road-free early plant and four cheaper Tiers without Goods', () => {
    const start = city([]);
    const placed = dispatch(start, { type: 'PlaceBuilding', buildingType: 'coalPlant', x: 55, y: 55 }, 0);
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.state.urbs).toBe(start.urbs - 150);
    expect(placed.state.buildings[0]?.coalEnabled).toBe(true);
    let current = placed.state;
    for (const [tier, cost] of [[2, 300], [3, 900], [4, 1800]]) {
      const upgraded = dispatch(current, { type: 'UpgradeBuilding', buildingId: 100 }, 0);
      expect(upgraded.ok).toBe(true);
      if (!upgraded.ok) return;
      expect(upgraded.state.urbs).toBe(current.urbs - cost!);
      expect(upgraded.state.buildings[0]?.tier).toBe(tier);
      expect(footprintOf('coalPlant', 1, tier)).toEqual({ width: 1, depth: 1 });
      expect(upgraded.state.storage).toEqual(start.storage);
      current = upgraded.state;
    }
    expect(dispatch(current, { type: 'UpgradeBuilding', buildingId: 100 }, 0)).toMatchObject({ ok: false, error: { key: 'error.maxTier' } });
  });

  it('disables only the chosen plant and preserves that choice across upgrades', () => {
    const start = city([building(1, 'coalPlant'), building(2, 'coalPlant', 10), building(3, 'home')]);
    const disabled = dispatch(start, { type: 'SetCoalEnabled', buildingId: 1, enabled: false }, 0);
    expect(disabled.ok).toBe(true);
    if (!disabled.ok) return;
    expect(energyStats(disabled.state).coalRates.get(1)).toBe(0);
    expect(energyStats(disabled.state).coalRates.get(2)).toBe(1);
    const upgraded = dispatch(disabled.state, { type: 'UpgradeBuilding', buildingId: 1 }, 0);
    expect(upgraded.ok && upgraded.state.buildings[0]?.coalEnabled).toBe(false);
    expect(dispatch(start, { type: 'SetCoalEnabled', buildingId: 3, enabled: false }, 0)).toMatchObject({ ok: false, error: { key: 'error.cannotProduce' } });
    expect(dispatch(start, { type: 'SetCoalEnabled', buildingId: 999, enabled: false }, 0)).toMatchObject({ ok: false, error: { key: 'error.unknownBuilding' } });
  });
});

describe('coal energy allocation', () => {
  it.each([1, 2, 3, 4])('provides stable Tier %i Capacity regardless of daylight or wind', tier => {
    for (const hour of [0, 6, 12, 18, 23]) {
      const state = city([building(1, 'home', 0, { tier: 8 }), building(2, 'home', 30, { tier: 8 }), building(3, 'coalPlant', 5, { tier })], { lastSeen: hour * H });
      const energy = energyStats(state);
      expect(energy.coal).toBe(COAL_CAPACITY[tier - 1]);
      expect(energy.coal + energy.unmet).toBe(energy.demand);
      expect(energy.coalCostPerHour).toBeCloseTo(energy.coal * 0.05);
    }
  });

  it('uses renewables before coal, and coal before batteries and backup', () => {
    const buildings = [building(1, 'home', 0, { tier: 8 }), building(2, 'coalPlant', 5), building(3, 'powerPlant', 6), building(4, 'battery', 2, { storedEnergy: 24 }), building(5, 'backup', 8)];
    const energy = energyStats(city(buildings));
    expect(energy.wind).toBeCloseTo(8.4);
    expect(energy.coal).toBe(12);
    expect(energy.batteryRates.get(4)).toBe(-12);
    expect(energy.backup).toBeCloseTo(7.6);
    expect(energy.unmet).toBeCloseTo(0);
    const noCoal = energyStats(city(buildings.map(b => b.type === 'coalPlant' ? { ...b, coalEnabled: false } : b)));
    expect(noCoal.coal).toBe(0);
    expect(noCoal.backup).toBeCloseTo(19.6);
  });

  it('does not pay, pollute or charge batteries with unused coal capacity', () => {
    const state = city([building(1, 'coalPlant'), building(2, 'battery', 2, { storedEnergy: 0 })]);
    const energy = energyStats(state);
    expect(energy.coal).toBe(0);
    expect(energy.costPerHour).toBe(0);
    expect(energy.emissions).toBe(0);
    expect(energy.batteryRates.get(2)).toBeCloseTo(0);
    expect(advance(state, H).state.buildings[1]?.storedEnergy).toBe(0);
  });

  it('splits generation by enabled Capacity and prioritizes Homes over industry', () => {
    const state = city([building(1, 'coalPlant', 5), building(2, 'coalPlant', 9, { tier: 2 }), building(3, 'coalPlant', 12, { coalEnabled: false }), building(4, 'home', 0, { tier: 8 }), building(5, 'factory', 15)]);
    const energy = energyStats(state);
    expect(energy.coalRates.get(1)).toBe(12);
    expect(energy.coalRates.get(2)).toBe(24);
    expect(energy.coalRates.get(3)).toBe(0);
    expect(energy.supplied.get(4)).toBe(36);
    expect(energy.supplied.get(5)).toBe(0);
    expect(energyStats({ ...state, buildings: [...state.buildings].reverse() }).coalRates).toEqual(energy.coalRates);
  });

  it('powers electric transit without consuming the stored coal Material', () => {
    const state = city([building(1, 'railStation', 0, { y: 1 }), building(2, 'railStation', 4, { y: 1 }), building(3, 'coalPlant', 10)], {
      rails: Array.from({ length: 5 }, (_, x) => ({ x, y: 0, exits: x === 0 ? ['E'] : x === 4 ? ['W'] : ['E', 'W'] })),
      transitLines: [{ id: 4, mode: 'rail', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 10 }],
      transitFleet: [{ id: 5, kind: 'trainElectric', purchasePrice: 2400, lineId: 4 }],
      storage: { materials: { coal: 0.25 }, goods: {} },
    });
    expect(energyStats(state).transitRatio).toBe(1);
    expect(energyStats(state).coal).toBeGreaterThan(0);
    expect(advance(state, H).state.storage.materials.coal).toBe(0.25);
  });
});

describe('local coal pollution and affordability', () => {
  it('scales local pollution with activity, respects its radius, and stops while disabled', () => {
    const home = building(1, 'home');
    const plant = building(2, 'coalPlant', 6);
    const state = city([home, plant]);
    expect(homeBenefits(state, home).pollutionPenalty).toBeCloseTo(10 / 12);
    expect(homeBenefits(city([home, { ...plant, x: 7 }]), home).pollutionPenalty).toBe(0);
    expect(homeBenefits(city([home, { ...plant, coalEnabled: false }]), home).wellbeing).toBe(0);
    expect(homeBenefits({ ...state, urbs: 0 }, home).wellbeing).toBe(0);
  });

  it('caps overlapping penalties and reduces base Tax by at most 4%', () => {
    const home = building(1, 'home', 0, { tier: 8 });
    const state = city([home, building(2, 'coalPlant', 3), building(3, 'coalPlant', 4), building(4, 'coalPlant', 5), building(5, 'coalPlant', 6)], { adaptationUntil: 2 * H });
    expect(homeBenefits(state, home).wellbeing).toBe(-20);
    expect(cityBenefits(state).wellbeing).toBe(-20);
    const next = advance(state, H).state;
    expect(taxDue(next.buildings[0]!)).toBe(384);
    expect(next.urbs).toBeCloseTo(state.urbs - 2);
    expect(energyStats(state).coalEmissions).toBe(80);
  });

  it('preserves green-space benefits without erasing coal emissions', () => {
    const home = building(1, 'home');
    const state = city([home, building(2, 'coalPlant', 3), building(3, 'tree', 1)]);
    expect(homeBenefits(state, home).wellbeing).toBeGreaterThan(0);
    expect(cityBenefits(state).covered).toBe(6);
    expect(energyStats(state).emissions).toBe(2);
  });

  it('stops exactly at budget exhaustion and resumes after Tax collection', () => {
    const state = city([building(1, 'home'), building(2, 'coalPlant', 3)], { urbs: 0.025 });
    const next = advance(state, H).state;
    expect(next.urbs).toBe(0);
    expect(next.buildings[0]?.taxCitizenMs).toBeCloseTo(6 * H / 2 * (1 - 10 / 12 / 500));
    expect(energyStats(next).coal).toBe(0);
    const collected = dispatch(next, { type: 'Collect', buildingId: 1 }, H);
    expect(collected.ok).toBe(true);
    if (collected.ok) expect(energyStats(collected.state).coal).toBe(1);
  });

  it('matches live ticks and Catch-up across budget, battery, wind and production boundaries', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 24 }), fc.integer({ min: 0, max: 30 }), (hour, storedEnergy, urbs) => {
      const now = 1791021600000 + hour * H;
      const state = city([building(1, 'home', 0, { tier: 8 }), building(2, 'coalPlant', 4), building(3, 'powerPlant', 6), building(4, 'battery', 2, { storedEnergy }), building(5, 'backup', 8), building(6, 'factory', 12, {
        queue: [{ item: 'planks', duration: 7 * 60_000, startedAt: now, done: false, quantity: 1 }, { item: 'planks', duration: 13 * 60_000, startedAt: null, done: false, quantity: 1 }],
      })], { lastSeen: now, urbs });
      const end = now + 6 * H;
      const once = advance(state, end).state;
      let split = state;
      for (let time = now + 137000; time < end; time += 137000) split = advance(split, time).state;
      split = advance(split, end).state;
      expect(split.urbs).toBeCloseTo(once.urbs, 5);
      for (const [i, b] of split.buildings.entries()) {
        expect(b.taxCitizenMs).toBeCloseTo(once.buildings[i]!.taxCitizenMs, 2);
        expect(b.storedEnergy ?? 0).toBeCloseTo(once.buildings[i]!.storedEnergy ?? 0, 5);
        expect(b.queue.map(q => q.done)).toEqual(once.buildings[i]!.queue.map(q => q.done));
      }
    }), { numRuns: 30 });
  });

  it('matches a Time skip with elapsed coal generation and pollution', () => {
    const state = city([building(1, 'home'), building(2, 'coalPlant', 3)], { lastSeen: 12 * H });
    const skipped = dispatch(state, { type: 'SkipTime', hours: 2 }, state.lastSeen);
    const elapsed = advance(state, state.lastSeen + 2 * H).state;
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(skipped.state.urbs).toBeCloseTo(elapsed.urbs);
    expect(skipped.state.buildings[0]?.taxCitizenMs).toBeCloseTo(elapsed.buildings[0]!.taxCitizenMs);
  });
});
