import { describe, expect, it } from 'vitest';
import { createBuilding, energyStats, homeBenefits, newGame, type GameState } from '../index';
import { fieldValueAt, paintedValues } from './tileField';
import { pollutionField } from './pollutionField';

const NOW = 1_700_000_000_000;
const base = newGame({ seed: 'pollution-field', now: NOW });
const city = (...buildings: ReturnType<typeof createBuilding>[]): GameState => ({ ...base, buildings, nextId: buildings.length + 1, adaptationUntil: 0 });

describe('pollution field', () => {
  it('is zero everywhere in a city without emitters', () => {
    const field = pollutionField(city());
    expect(paintedValues(field).length).toBeGreaterThan(0);
    expect(Math.max(...paintedValues(field))).toBe(0);
  });

  it('matches the Pollution malus of a Home standing on the tile', () => {
    const coal = createBuilding(1, 'coalPlant', 60, 60, 0);
    const home = createBuilding(2, 'home', 62, 60, 0);
    const state = city(coal, home);
    const field = pollutionField(state);
    const penalty = homeBenefits(state, home, energyStats(state).coalRates).pollutionPenalty;
    expect(penalty).toBeGreaterThan(0);
    expect(fieldValueAt(field, home.x, home.y)).toBeCloseTo(penalty);
  });

  it('is zero beyond the reach of the emitters', () => {
    const state = city(createBuilding(1, 'coalPlant', 60, 60, 0));
    expect(fieldValueAt(pollutionField(state), 60 + 40, 60)).toBe(0);
  });

  it('does not depend on the order of the buildings', () => {
    const a = createBuilding(1, 'coalPlant', 60, 60, 0), b = createBuilding(2, 'coalPlant', 64, 60, 0);
    expect(pollutionField(city(a, b)).values).toEqual(pollutionField(city(b, a)).values);
  });

  it('stays at zero on tiles outside owned Parcels', () => {
    const state = { ...city(createBuilding(1, 'coalPlant', 60, 60, 0)), ownedParcels: [] };
    expect(paintedValues(pollutionField(state))).toEqual([]);
  });
});
