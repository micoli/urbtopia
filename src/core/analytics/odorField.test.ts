import { describe, expect, it } from 'vitest';
import { WASTE_FACILITIES, createBuilding, newGame, odorPenaltyOf, type Building, type GameState } from '../index';
import { fieldValueAt, paintedValues } from './tileField';
import { odorField } from './odorField';

const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const mound = (id: number, x: number, y: number): Building => createBuilding(id, 'mound', x, y, 0);
const roadRow = Array.from({ length: 61 }, (_, index) => ({ x: 30 + index, y: 49, kind: 'road' as const }));
const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'odor-field', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow, roundabouts: [], pedestrianWays: [], adaptationUntil: 0,
});
const target = home(10, 64, 48, 2);

describe('odor field', () => {
  it('is empty without a Mound', () => {
    expect(Math.max(...paintedValues(odorField(city([target]))))).toBe(0);
  });

  it('matches the odor malus of a Home standing on the tile', () => {
    const state = city([target, mound(1, 66, 50)]);
    const malus = odorPenaltyOf(state, target);
    expect(malus).toBe(WASTE_FACILITIES.mound.odor!.malus);
    expect(fieldValueAt(odorField(state), target.x, target.y)).toBe(malus);
  });

  it('takes the worst Mound, never the sum', () => {
    const one = odorField(city([target, mound(1, 66, 50)]));
    const three = odorField(city([target, mound(1, 66, 50), mound(2, 68, 50), mound(3, 70, 50)]));
    expect(Math.max(...paintedValues(three))).toBe(Math.max(...paintedValues(one)));
  });

  it('is zero beyond the Odor radius', () => {
    const state = city([target, mound(1, 66, 50)]);
    expect(fieldValueAt(odorField(state), 66 + WASTE_FACILITIES.mound.odor!.radius + 6, 50)).toBe(0);
  });
});
