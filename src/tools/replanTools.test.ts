import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type GameState } from '../core';
import { confirmTool, evaluateTool, type Tool } from './tools';

const T0 = 1_700_000_000_000;

function replanning(): GameState {
  const base = newGame({ seed: 'replan-tools', now: T0 });
  const city: GameState = {
    ...base, tutorial: null,
    roads: [{ x: 60, y: 60, kind: 'road' }, { x: 61, y: 60, kind: 'road' }, { x: 62, y: 60, kind: 'road', tier: 2 }],
    buildings: [createBuilding(500, 'home', 56, 57, 0)],
    waterTiles: [{ x: 70, y: 70 }],
  };
  const result = dispatch(city, { type: 'StartReplan' }, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

const at = (x: number, y: number) => ({ x, y });

describe('Replan tools', () => {
  it('places the first Building of a type from the Stash, with the rotation asked', () => {
    const state = replanning();
    const tool: Tool = { kind: 'replanBuilding', buildingType: 'home' };
    const evaluation = evaluateTool(tool, { state, tile: at(60, 60), rotation: 2 });
    expect(evaluation.valid).toBe(true);
    expect(evaluation.command).toEqual({ type: 'Replan', action: { kind: 'placeBuilding', id: 500, x: 60, y: 60, rotation: 2 } });
    expect(confirmTool(tool, at(60, 60), evaluation).nextTool).toEqual(tool);
  });

  it('has nothing to place once the Stash holds no Building of that type', () => {
    const state = replanning();
    const evaluation = evaluateTool({ kind: 'replanBuilding', buildingType: 'powerPlant' }, { state, tile: at(60, 60), rotation: null });
    expect(evaluation.command).toBeNull();
    expect(evaluation.valid).toBe(false);
  });

  it('draws a Road by path, in two steps, with the tier of the group', () => {
    const state = replanning();
    const tool: Tool = { kind: 'replanPath', layer: 'roads', tier: 2, start: null, horizontalFirst: true };
    const first = confirmTool(tool, at(50, 50), evaluateTool(tool, { state, tile: at(50, 50), rotation: null }));
    expect(first.command).toBeNull();
    const armed = first.nextTool as Extract<Tool, { kind: 'replanPath' }>;
    expect(armed.start).toEqual(at(50, 50));
    const evaluation = evaluateTool(armed, { state, tile: at(50, 50), rotation: null });
    expect(evaluation.valid).toBe(true);
    expect(evaluation.command).toEqual({ type: 'Replan', action: { kind: 'placeTiles', layer: 'roads', tiles: [at(50, 50)], tier: 2 } });
    expect(confirmTool(armed, at(50, 50), evaluation).nextTool).toEqual({ ...armed, start: null });
  });

  it('paints Water tiles with the brush and lays Crossings and Roundabouts tile by tile', () => {
    const state = replanning();
    const water = evaluateTool({ kind: 'brush', action: 'replanWater', tiles: [at(60, 66)] }, { state, tile: at(60, 66), rotation: null });
    expect(water.valid).toBe(true);
    const crossing = evaluateTool({ kind: 'replanTile', layer: 'roads', crossing: true }, { state, tile: at(50, 50), rotation: null });
    expect(crossing.valid).toBe(false);
    const roundabout = evaluateTool({ kind: 'replanTile', layer: 'roundabouts' }, { state, tile: at(70, 60), rotation: null });
    expect(roundabout.ghost.tiles).toHaveLength(9);
  });

  it('lets the player lay Underground walkways on Level -1', () => {
    const tool: Tool = { kind: 'replanPath', layer: 'walkways', start: null, horizontalFirst: true };
    expect(evaluateTool(tool, { state: replanning(), tile: at(50, 50), rotation: null }).command).toBeNull();
  });
});
