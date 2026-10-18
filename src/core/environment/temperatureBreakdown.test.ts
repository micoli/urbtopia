import { describe, expect, it } from 'vitest';
import { cityBenefits, coolingElements, cityTransportStats, climateStats, createBuilding, energyStats, isAdapting, newGame, temperatureBreakdown, type Building, type GameState } from '../index';

const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'breakdown', now: 0 }), buildings, roads: [], urbs: 10000,
});

const breakdownOf = (state: GameState) => {
  const energy = energyStats(state);
  return temperatureBreakdown({
    climate: climateStats(state), energy, transport: cityTransportStats(state),
    cooling: cityBenefits(state, energy.coalRates).cooling, adapting: isAdapting(state),
  });
};

describe('temperature breakdown', () => {
  it('reports an optimal city without sources or tips', () => {
    const breakdown = breakdownOf(city([]));
    expect(breakdown.optimal).toBe(true);
    expect(breakdown.tips).toEqual([]);
    expect(breakdown.advisesGreen).toBe(false);
    expect(breakdown.sources.every(source => source.degrees === 0)).toBe(true);
  });

  it('splits the warming by source and sums to the city temperature', () => {
    const state = city([createBuilding(1, 'home', 0, 0, 0), createBuilding(2, 'factory', 6, 0, 0), createBuilding(3, 'coalPlant', 3, 0, 0)]);
    const breakdown = breakdownOf(state);
    const total = breakdown.sources.reduce((sum, source) => sum + source.degrees, 0);
    expect(total).toBeCloseTo(climateStats(state).temperature - 26);
    expect(breakdown.sources.find(source => source.source === 'activity')!.degrees).toBeGreaterThan(0);
  });

  it('keeps at most two source tips, heaviest first, and adds the green tip when cooling is low', () => {
    const state = city([createBuilding(1, 'home', 0, 0, 0), createBuilding(2, 'factory', 6, 0, 0), createBuilding(3, 'coalPlant', 3, 0, 0)]);
    const breakdown = breakdownOf(state);
    expect(breakdown.tips.length).toBeLessThanOrEqual(2);
    expect(breakdown.advisesGreen).toBe(true);
  });

  it('flags the 40 °C cap', () => {
    const factories = Array.from({ length: 100 }, (_, id) => createBuilding(id + 1, 'factory', id * 3, 0, 0));
    expect(breakdownOf(city(factories)).capped).toBe(true);
  });

  it('shares the warming across sources and gives the uncooled temperature', () => {
    const state = city([createBuilding(1, 'home', 0, 0, 0), createBuilding(2, 'factory', 6, 0, 0), createBuilding(3, 'park', 2, 0, 0)]);
    const breakdown = breakdownOf(state);
    expect(breakdown.sources.reduce((sum, source) => sum + source.share, 0)).toBeCloseTo(1);
    expect(breakdown.uncooled - breakdown.reduction).toBeCloseTo(breakdown.temperature);
  });

  it('lists the cooling green spaces by weight', () => {
    const elements = coolingElements(city([createBuilding(1, 'park', 0, 0, 0), createBuilding(2, 'park', 8, 0, 0), createBuilding(3, 'home', 4, 0, 0)]));
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({ type: 'park', count: 2, share: 1 });
    expect(coolingElements(city([]))).toEqual([]);
  });
});
