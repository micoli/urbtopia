import { describe, expect, it } from 'vitest';
import { cityBenefits, cityTransportStats, climateStats, createBuilding, energyStats, heatSourceItems, newGame, type Building, type GameState } from '../index';

const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'heat-items', now: 0 }), buildings, roads: [], urbs: 10000,
});

const itemsOf = (state: GameState) => {
  const energy = energyStats(state);
  return heatSourceItems(state, {
    climate: climateStats(state), energy, transport: cityTransportStats(state), cooling: cityBenefits(state, energy.coalRates).cooling,
  });
};

describe('heat source items', () => {
  it('lists the activity buildings by decreasing impact', () => {
    const items = itemsOf(city([createBuilding(1, 'workshop', 0, 0, 0), { ...createBuilding(2, 'factory', 6, 0, 0), tier: 2 }, createBuilding(3, 'home', 12, 0, 0)])).activity;
    expect(items.map(item => item.kind === 'building' && item.building.id)).toEqual([2, 1]);
    expect(items[0]!.impact).toBeGreaterThan(items[1]!.impact);
  });

  it('adds up to the impact of each source', () => {
    const state = city([createBuilding(1, 'home', 0, 0, 0), createBuilding(2, 'factory', 6, 0, 0), createBuilding(3, 'coalPlant', 3, 0, 0)]);
    const items = itemsOf(state);
    const sum = (list: { impact: number }[]) => list.reduce((total, item) => total + item.impact, 0);
    expect(sum(items.activity)).toBeCloseTo(climateStats(state).activityEmissions);
    expect(sum(items.coal)).toBeCloseTo(energyStats(state).coalEmissions);
    expect(sum(items.transport)).toBeCloseTo(cityTransportStats(state).emissions);
  });

  it('reports citizens outside public transport as a transport item', () => {
    const items = itemsOf(city([createBuilding(1, 'home', 0, 0, 0)])).transport;
    expect(items.some(item => item.kind === 'citizens')).toBe(true);
  });
});
