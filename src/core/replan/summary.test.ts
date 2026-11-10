import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import { autoRotation } from '../map/placement';
import type { GameState } from '../engine/state';
import { layoutOf } from './layout';
import { isReplanSummaryEmpty, replanSummary } from './summary';

const T0 = 1_700_000_000_000;

function city(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'replan-summary', now: T0 });
  return { ...base, tutorial: null, roads: [{ x: 60, y: 60, kind: 'road' }, { x: 60, y: 61, kind: 'road' }], buildings: [], ...overrides };
}

describe('the summary of a Replan', () => {
  it('lists the Buildings that no Road reaches and counts the lines to draw again', () => {
    const connected = createBuilding(1, 'home', 59, 60, autoRotation(city(), 'home', 59, 60));
    const stranded = createBuilding(2, 'home', 50, 50, 0);
    const state = city({ buildings: [connected, stranded] });
    const start = city({ busLines: [{ id: 7, stops: [3, 4] }], transitLines: [{ id: 8, mode: 'rail', stops: [5, 6], peakHeadway: 5, offPeakHeadway: 10 }] });
    const summary = replanSummary({ ...state, replan: { stash: { buildings: [] }, start: layoutOf(start) } });
    expect(summary.withoutAccess.map((building) => building.id)).toEqual([2]);
    expect(summary.droppedLines).toBe(2);
    expect(isReplanSummaryEmpty(summary)).toBe(false);
  });

  it('is empty when everything is connected and the City had no line', () => {
    const state = city({ buildings: [createBuilding(1, 'home', 59, 60, autoRotation(city(), 'home', 59, 60))] });
    expect(isReplanSummaryEmpty(replanSummary({ ...state, replan: { stash: { buildings: [] }, start: layoutOf(state) } }))).toBe(true);
  });
});
