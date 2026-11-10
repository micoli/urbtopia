import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type GameState } from '../../core';
import { stashGroups } from './stashGroups';

const T0 = 1_700_000_000_000;

function replanning(): GameState {
  const base = newGame({ seed: 'stash-groups', now: T0 });
  const city: GameState = {
    ...base, tutorial: null,
    roads: [{ x: 60, y: 60, kind: 'road' }, { x: 61, y: 60, kind: 'road' }, { x: 62, y: 60, kind: 'road', tier: 2 }, { x: 63, y: 60, kind: 'crossing' }],
    buildings: [createBuilding(500, 'home', 56, 57, 0), createBuilding(501, 'home', 52, 57, 0), createBuilding(502, 'workshop', 56, 52, 0)],
    waterTiles: [{ x: 70, y: 70 }],
    walkways: [{ x: 50, y: 50 }],
  };
  const result = dispatch(city, { type: 'StartReplan' }, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

describe('the groups of the Stash', () => {
  it('counts Buildings by type, Roads by tier and the rest by kind, each with the tool that places it', () => {
    const groups = stashGroups(replanning());
    const byId = Object.fromEntries(groups.map((group) => [group.id, group]));
    expect(byId['building-home']?.count).toBe(2);
    expect(byId['building-workshop']?.count).toBe(1);
    expect(byId['roads-1']).toMatchObject({ count: 2, tool: { kind: 'replanPath', layer: 'roads' } });
    expect(byId['roads-2']).toMatchObject({ count: 1, tool: { kind: 'replanPath', layer: 'roads', tier: 2 } });
    expect(byId['crossings']).toMatchObject({ count: 1, tool: { kind: 'replanTile', crossing: true } });
    expect(byId['water']).toMatchObject({ count: 1, tool: { kind: 'brush', action: 'replanWater' } });
    expect(byId['walkways']?.count).toBe(1);
  });

  it('has no group for what is not in the Stash', () => {
    const groups = stashGroups(replanning());
    expect(groups.some((group) => group.id === 'rails' || group.id === 'fields' || group.id.startsWith('boat-'))).toBe(false);
  });
});
