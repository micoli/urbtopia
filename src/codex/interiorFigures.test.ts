import { describe, expect, it } from 'vitest';
import { INTERIOR_EXAMPLES, createBuilding, newGame, type GameState } from '../core';
import { CODEX_INTERIOR_TYPES, interiorFigures, liveInteriorsOf } from './interiorFigures';

const state = newGame({ seed: 'interior-figures', now: 0 });

describe('the figures of the Interiors page', () => {
  it('gives every interior a room and a benefit for each Tier', () => {
    for (const type of CODEX_INTERIOR_TYPES) {
      const figures = interiorFigures(state, type);
      expect(figures.room.length, type).toBeGreaterThan(0);
      expect(figures.columns.length, type).toBeGreaterThan(0);
      for (const column of figures.columns) expect(column.values, `${type} ${column.label}`).toHaveLength(figures.room.length);
    }
  });

  it('carries an example for the Production interiors and none for the Service ones', () => {
    for (const type of CODEX_INTERIOR_TYPES) expect(interiorFigures(state, type).example !== undefined, type).toBe(type in INTERIOR_EXAMPLES);
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
