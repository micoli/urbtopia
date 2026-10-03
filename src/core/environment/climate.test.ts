import { describe, expect, it } from 'vitest';
import { climateStats, createBuilding, energyStats, newGame, transportStats, type Building, type GameState } from '../index';

const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'climate', now: 0 }), buildings, roads: [], urbs: 10000,
});

describe('city temperature', () => {
  it('starts at the 26 °C optimum without ecological impact', () => {
    expect(climateStats(city([]))).toEqual({ activityEmissions: 0, emissions: 0, temperature: 26 });
  });

  it('increases with emissions from economic activity', () => {
    const factory = createBuilding(1, 'factory', 0, 0, 0);
    expect(climateStats(city([factory])).temperature).toBeCloseTo(26.2);
    expect(climateStats(city([{ ...factory, tier: 2 }])).temperature).toBeCloseTo(26.4);
  });

  it('includes power generation and mobility in ecological impact', () => {
    const state = city([createBuilding(1, 'home', 0, 0, 0), createBuilding(2, 'coalPlant', 3, 0, 0)]);
    const climate = climateStats(state);
    const emissions = energyStats(state).emissions + transportStats(state).emissions;
    expect(emissions).toBeGreaterThan(0);
    expect(climate.emissions).toBeCloseTo(emissions);
    expect(climate.temperature).toBeCloseTo(26 + emissions / 10);
  });

  it('caps the temperature at 40 °C while emissions keep increasing', () => {
    const factories = Array.from({ length: 100 }, (_, id) => createBuilding(id + 1, 'factory', id * 3, 0, 0));
    const climate = climateStats(city(factories));
    const expanded = climateStats(city([...factories, createBuilding(101, 'factory', 300, 0, 0)]));
    expect(climate.temperature).toBe(40);
    expect(expanded.temperature).toBe(40);
    expect(expanded.emissions).toBeGreaterThan(climate.emissions);
  });

  it('lets nearby green spaces reduce warming while preserving emissions', () => {
    const home = createBuilding(1, 'home', 0, 0, 0);
    const state = city([home, createBuilding(2, 'factory', 6, 0, 0)]);
    const greenState = { ...state, buildings: [...state.buildings, createBuilding(3, 'park', 2, 0, 0)] };
    const climate = climateStats(state), greenClimate = climateStats(greenState);
    expect(greenClimate.emissions).toBe(climate.emissions);
    expect(greenClimate.temperature).toBeLessThan(climate.temperature);
    expect(greenClimate.temperature).toBeGreaterThanOrEqual(26);
  });

  it('uses the effective activity after the adaptation period', () => {
    const state = { ...city([createBuilding(1, 'factory', 0, 0, 0)]), adaptationUntil: 0 };
    expect(climateStats(state).activityEmissions).toBe(0);
    expect(climateStats(state).temperature).toBe(26);
  });
});
