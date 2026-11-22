import { describe, expect, it } from 'vitest';
import { INTERIOR_EXAMPLES, createBuilding, newGame, type GameState } from '../core';
import { CODEX_INTERIOR_TYPES, interiorFigures, liveInteriorsOf } from './interiorFigures';

const state = newGame({ seed: 'interior-figures', now: 0 });

describe('the figures of the Interiors page', () => {
  it('gives every interior a room and a benefit for each Tier, but the Workshop, whose only gain is its queue', () => {
    for (const type of CODEX_INTERIOR_TYPES) {
      const figures = interiorFigures(state, type);
      expect(figures.room.length, type).toBeGreaterThan(0);
      if (type === 'workshop') expect(figures.columns).toEqual([]);
      else expect(figures.columns.length, type).toBeGreaterThan(0);
      for (const column of figures.columns) expect(column.values, `${type} ${column.label}`).toHaveLength(figures.room.length);
    }
  });

  it('carries an example for the Production interiors and none for the Service ones', () => {
    for (const type of CODEX_INTERIOR_TYPES) expect(interiorFigures(state, type).example !== undefined, type).toBe(type in INTERIOR_EXAMPLES);
  });

  it('lists the Recycling plant with its limits by Tier and the gains of its complete lines', () => {
    const figures = interiorFigures(state, 'recyclingPlant');
    expect(figures.columns.map(({ label }) => label)).toEqual(['codex.interiors.collectionExits', 'codex.interiors.sorters', 'codex.interiors.recyclers']);
    expect(figures.example).toBeDefined();
    const plant = { ...createBuilding(1, 'recyclingPlant', 55, 50, 0), interior: { nextFixtureId: 100, fixtures: INTERIOR_EXAMPLES.recyclingPlant!.fixtures.map((fixture, index) => ({ id: index + 1, ...fixture })) } };
    const [live] = liveInteriorsOf({ ...state, buildings: [plant] }, 'recyclingPlant');
    expect(live!.benefits.map(({ label }) => label)).toEqual(['codex.interiors.wasteCapacity', 'codex.interiors.collectionDistance']);
    expect(live!.benefits.every(({ value }) => value > 0)).toBe(true);
  });

  it('lists the Engine rooms with the Capacity they add by Tier, and the pollution they take away for the Coal one', () => {
    expect(interiorFigures(state, 'coalPlant').columns.map(({ label }) => label)).toEqual(['factory.interior.generation', 'factory.interior.cleaner']);
    expect(interiorFigures(state, 'hydroPlant').columns.map(({ label }) => label)).toEqual(['factory.interior.generation']);
    expect(interiorFigures(state, 'geothermalPlant').columns[0]!.values).toEqual([0.05, 0.08, 0.11, 0.15, 0.2, 0.25]);
    expect(interiorFigures(state, 'largeGeothermalPlant').columns[0]!.values).toEqual([0.25]);
  });

  it('shows the gains of the complete Circuits of an Engine room now', () => {
    for (const type of ['coalPlant', 'hydroPlant', 'geothermalPlant'] as const) {
      const plant = { ...createBuilding(1, type, 55, 50, 0), interior: { nextFixtureId: 100, fixtures: INTERIOR_EXAMPLES[type]!.fixtures.map((fixture, index) => ({ id: index + 1, ...fixture })) } };
      const [live] = liveInteriorsOf({ ...state, buildings: [plant] }, type);
      expect(live!.benefits[0]!.label, type).toBe('factory.interior.generation');
      expect(live!.benefits[0]!.value, type).toBeGreaterThan(0);
    }
  });

  it('reads the Staff posts of an interior from the rules', () => {
    expect(interiorFigures(state, 'hospital').roles.map(({ role }) => role)).toEqual(['nurse', 'doctor', 'surgeon']);
    expect(interiorFigures(state, 'factory').roles).toEqual([]);
  });

  it('shows what a fitted interior brings now, and nothing for a building without one', () => {
    const factory = { ...createBuilding(1, 'factory', 55, 50, 0), tier: 3, interior: { nextFixtureId: 4, fixtures: [{ id: 1, type: 'factoryMotor' as const, x: 3, y: 3, rotation: 0 as const }, { id: 2, type: 'factoryShaft' as const, x: 3, y: 4, rotation: 0 as const }, { id: 3, type: 'factoryPress' as const, x: 3, y: 5, rotation: 2 as const }] } };
    const city: GameState = { ...state, buildings: [factory, createBuilding(2, 'mill', 60, 50, 0)] };
    const [live] = liveInteriorsOf(city, 'factory');
    expect(live?.fixtures).toBe(3);
    expect(live?.benefits.find(benefit => benefit.label === 'factory.interior.speed')?.value).toBeGreaterThan(0);
    expect(liveInteriorsOf(city, 'mill')).toEqual([]);
  });
});
