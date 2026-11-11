import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type GameState } from '../../core';
import { stashGroups, stashSections } from './stashGroups';

const T0 = 1_700_000_000_000;

function replanning(): GameState {
  const base = newGame({ seed: 'stash-groups', now: T0 });
  const city: GameState = {
    ...base, tutorial: null,
    roads: [{ x: 60, y: 60, kind: 'road' }, { x: 61, y: 60, kind: 'road' }, { x: 62, y: 60, kind: 'road', tier: 2 }, { x: 63, y: 60, kind: 'crossing' }, { x: 64, y: 60, kind: 'crossing', tier: 2 }],
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
    expect(byId['crossings-2']).toMatchObject({ count: 1, tool: { kind: 'replanTile', crossing: true, tier: 2 }, drop: { kind: 'tiles', layer: 'roads', crossing: true, tier: 2 } });
    expect(byId['water']).toMatchObject({ count: 1, tool: { kind: 'brush', action: 'replanWater' } });
    expect(byId['walkways']?.count).toBe(1);
  });

  it('has no group for what is not in the Stash', () => {
    const groups = stashGroups(replanning());
    expect(groups.some((group) => group.id === 'rails' || group.id === 'fields' || group.id.startsWith('boat-'))).toBe(false);
  });

  it('puts the network first, then the Buildings in the order of the build menu, with a picture for each', () => {
    const sections = stashSections(replanning());
    expect(sections.map((section) => section.id)).toEqual(['replan.section.network', 'build.housing', 'build.production']);
    expect(sections[0]?.groups.every((group) => group.codexId !== undefined || group.icon !== undefined)).toBe(true);
    expect(sections[1]?.groups.map((group) => group.id)).toEqual(['building-home']);
  });

  it('puts the groups set off at the very bottom, in a Later section', () => {
    const state = replanning();
    const later = { ...state, replan: { ...state.replan!, later: ['building-home', 'roads-1'] } };
    const sections = stashSections(later);
    expect(sections.at(-1)?.id).toBe('replan.section.later');
    expect(sections.at(-1)?.groups.find((group) => group.id === 'building-home')?.origin).toBe('build.housing');
    expect(sections.at(-1)?.groups.map((group) => group.id).sort()).toEqual(['building-home', 'roads-1']);
    expect(sections.some((section) => section.id === 'build.housing')).toBe(false);
  });
});
