import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { confirmTool, evaluateTool, extendBrush, selectionGhost, type Tool } from './tools';

const state: GameState = newGame({ seed: 'amber-fox-4821', now: 0 });

const shopTool: Tool = { kind: 'building', buildingType: 'shop' };

describe('building tool', () => {
  it('shows a valid ghost turned toward the adjacent road and the placement command', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 56, y: 57 }, rotation: null });
    expect(evaluation.valid).toBe(true);
    expect(evaluation.rotation).toBe(2);
    expect(evaluation.cost).toBe(300);
    expect(evaluation.command).toEqual({ type: 'PlaceBuilding', buildingType: 'shop', x: 56, y: 57, rotation: 2 });
  });

  it('explains why a ghost is invalid', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 70, y: 70 }, rotation: null });
    expect(evaluation.valid).toBe(false);
    expect(evaluation.issue).toBe('error.needsRoad');
  });

  it('respects a rotation chosen by the player', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 56, y: 57 }, rotation: 0 });
    expect(evaluation.rotation).toBe(0);
    expect(evaluation.issue).toBe('error.needsRoad');
  });

  it('covers the whole footprint of a large building', () => {
    const evaluation = evaluateTool({ kind: 'building', buildingType: 'storehouse' }, { state, tile: { x: 56, y: 59 }, rotation: null });
    expect(evaluation.ghost.tiles).toHaveLength(4);
  });
});

describe('Public facility tool', () => {
  const homes = [createBuilding(10, 'home', 56, 59, 0), createBuilding(11, 'home', 60, 59, 0), createBuilding(12, 'home', 75, 59, 0)];
  const served: GameState = { ...state, nextId: 20, buildings: [...state.buildings, ...homes] };
  const evaluate = (buildingType: 'school' | 'townHall') => evaluateTool({ kind: 'building', buildingType }, { state: served, tile: { x: 56, y: 61 }, rotation: 0 });

  it('previews the radius and highlights the Homes it would cover', () => {
    const evaluation = evaluate('school');
    expect(evaluation.coverage).toEqual({ cityWide: false, homes: 2 });
    expect(evaluation.ghost.rects.map((rect) => rect.x).sort()).toEqual([56, 60]);
    expect(evaluation.ghost.range?.length).toBeGreaterThan(100);
  });

  it('shows a city-wide indication without a radius', () => {
    const evaluation = evaluate('townHall');
    expect(evaluation.coverage).toEqual({ cityWide: true, homes: 3 });
    expect(evaluation.ghost.range).toBeUndefined();
  });

  it('shows the radius of a selected Public facility, but not of a city-wide one', () => {
    const school = createBuilding(20, 'school', 56, 61, 0);
    const hall = createBuilding(21, 'townHall', 60, 61, 0);
    const withFacilities: GameState = { ...served, nextId: 30, buildings: [...served.buildings, school, hall] };
    expect(selectionGhost(withFacilities, 20)?.range?.length).toBeGreaterThan(100);
    expect(selectionGhost(withFacilities, 21)?.range).toBeUndefined();
    expect(selectionGhost(withFacilities, 10)?.range).toBeUndefined();
  });

  it('does not preview coverage for other buildings', () => {
    expect(evaluateTool(shopTool, { state, tile: { x: 56, y: 57 }, rotation: null }).coverage).toBeUndefined();
  });
});

describe('road tool', () => {
  it('first asks for a start tile, without a command', () => {
    const evaluation = evaluateTool({ kind: 'road', start: null, horizontalFirst: true }, { state, tile: { x: 62, y: 58 }, rotation: null });
    expect(evaluation.command).toBeNull();
    expect(evaluation.ghost.tiles).toEqual([{ x: 62, y: 58 }]);
  });

  it('then previews the L path with the cost of the missing tiles', () => {
    const evaluation = evaluateTool(
      { kind: 'road', start: { x: 62, y: 58 }, horizontalFirst: false },
      { state, tile: { x: 62, y: 60 }, rotation: null },
    );
    expect(evaluation.ghost.tiles).toHaveLength(3);
    expect(evaluation.cost).toBe(4);
    expect(evaluation.command).toMatchObject({ type: 'BuildRoad', from: { x: 62, y: 58 }, to: { x: 62, y: 60 } });
  });
});

describe('other tools', () => {
  it('previews a 3x3 roundabout', () => {
    const evaluation = evaluateTool({ kind: 'roundabout' }, { state, tile: { x: 70, y: 70 }, rotation: null });
    expect(evaluation.ghost.tiles).toHaveLength(9);
    expect(evaluation.valid).toBe(true);
  });

  it('refuses a crossing where there is no road', () => {
    const evaluation = evaluateTool({ kind: 'crossing' }, { state, tile: { x: 70, y: 70 }, rotation: null });
    expect(evaluation.issue).toBe('error.noRoadHere');
  });

  it('previews moving a building with its own footprint', () => {
    const evaluation = evaluateTool({ kind: 'move', buildingId: 1 }, { state, tile: { x: 56, y: 59 }, rotation: null });
    expect(evaluation.ghost.tiles).toHaveLength(4);
    expect(evaluation.command).toMatchObject({ type: 'MoveBuilding', id: 1, x: 56, y: 59 });
  });
});

describe('parcel tool', () => {
  it('targets the Parcel under the centre tile and hints at every buyable Parcel', () => {
    const evaluation = evaluateTool({ kind: 'parcel' }, { state, tile: { x: 40, y: 56 }, rotation: null });
    expect(evaluation.command).toEqual({ type: 'BuyParcel', x: 2, y: 3 });
    expect(evaluation.valid).toBe(true);
    expect(evaluation.cost).toBe(300);
    expect(evaluation.ghost.rects.filter((rect) => rect.tone === 'hint')).toHaveLength(8);
    expect(evaluation.ghost.rects.find((rect) => rect.tone === 'target')).toMatchObject({ x: 32, y: 48, width: 16, depth: 16 });
  });

  it('explains why a Parcel cannot be bought', () => {
    const evaluation = evaluateTool({ kind: 'parcel' }, { state, tile: { x: 10, y: 10 }, rotation: null });
    expect(evaluation.valid).toBe(false);
    expect(evaluation.issue).toBe('error.parcelNotAdjacent');
  });
});

describe('confirmTool', () => {
  it('sends the command of a valid evaluation and leaves the building tool', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 56, y: 57 }, rotation: null });
    expect(confirmTool(shopTool, { x: 56, y: 57 }, evaluation)).toEqual({ command: evaluation.command, nextTool: null });
  });

  it('keeps the building tool when asked to, so that several can be placed in a row', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 56, y: 57 }, rotation: null });
    expect(confirmTool(shopTool, { x: 56, y: 57 }, evaluation, true)).toEqual({ command: evaluation.command, nextTool: shopTool });
  });

  it('never keeps a move going, whatever is asked', () => {
    const tool: Tool = { kind: 'move', buildingId: 1 };
    const evaluation = evaluateTool(tool, { state, tile: { x: 56, y: 59 }, rotation: null });
    expect(confirmTool(tool, { x: 56, y: 59 }, evaluation, true).nextTool).toBeNull();
  });

  it('does nothing for an invalid evaluation', () => {
    const evaluation = evaluateTool(shopTool, { state, tile: { x: 70, y: 70 }, rotation: null });
    expect(confirmTool(shopTool, { x: 70, y: 70 }, evaluation)).toEqual({ command: null, nextTool: shopTool });
  });

  it('stores the start tile of a road, then builds it and starts over', () => {
    const start: Tool = { kind: 'road', start: null, horizontalFirst: true };
    const first = confirmTool(start, { x: 62, y: 58 }, evaluateTool(start, { state, tile: { x: 62, y: 58 }, rotation: null }));
    expect(first.command).toBeNull();
    expect(first.nextTool).toEqual({ kind: 'road', start: { x: 62, y: 58 }, horizontalFirst: true });

    const second = confirmTool(first.nextTool!, { x: 62, y: 60 }, evaluateTool(first.nextTool!, { state, tile: { x: 62, y: 60 }, rotation: null }));
    expect(second.command).toMatchObject({ type: 'BuildRoad' });
    expect(second.nextTool).toEqual({ kind: 'road', start: null, horizontalFirst: true });
  });

  it('ends a move after it succeeds', () => {
    const tool: Tool = { kind: 'move', buildingId: 1 };
    const evaluation = evaluateTool(tool, { state, tile: { x: 56, y: 59 }, rotation: null });
    expect(confirmTool(tool, { x: 56, y: 59 }, evaluation).nextTool).toBeNull();
  });
});

describe('move tool', () => {
  const workshop = state.buildings.find((building) => building.type === 'workshop');
  const move: Tool = { kind: 'move', buildingId: workshop?.id ?? 0 };

  it('turns the building toward the closest road, on either side of it', () => {
    const above = evaluateTool(move, { state, tile: { x: 54, y: 56 }, rotation: null });
    const below = evaluateTool(move, { state, tile: { x: 54, y: 59 }, rotation: null });
    expect(above.valid && below.valid).toBe(true);
    expect(below.rotation).not.toBe(above.rotation);
  });
});

describe('selectionGhost', () => {
  it('surrounds the whole footprint of the selected building with a margin', () => {
    const workshop = state.buildings.find((building) => building.type === 'workshop');
    const ghost = selectionGhost(state, workshop?.id ?? null);
    expect(ghost?.rects).toEqual([{ x: (workshop?.x ?? 0) - 0.3, y: (workshop?.y ?? 0) - 0.3, width: 2.6, depth: 2.6, tone: 'target' }]);
  });

  it('follows the rotated footprint of a Home that grew', () => {
    const home = { ...createBuilding(9, 'home', 10, 20, 1), tier: 2 };
    const ghost = selectionGhost({ ...state, buildings: [home] }, 9);
    expect(ghost?.rects[0]).toMatchObject({ width: 1.6, depth: 2.6 });
  });

  it('shows nothing without a selection or for an unknown building', () => {
    expect(selectionGhost(state, null)).toBeNull();
    expect(selectionGhost(state, 999)).toBeNull();
  });
});

describe('brush tool', () => {
  const farmCity: GameState = {
    ...state,
    urbs: 1000,
    nextId: 20,
    seedStock: { wheat: 2 },
    buildings: [...state.buildings, { ...createBuilding(10, 'home', 40, 40, 0), tier: 3 }, createBuilding(11, 'farm', 56, 59, 0), createBuilding(12, 'waterTower', 70, 52, 0)],
    fields: [{ x: 50, y: 50 }, { x: 51, y: 50 }, { x: 52, y: 50, crop: { species: 'carrot', plantedAt: -3_600_000 } }],
  };
  const laying: Tool = { kind: 'brush', action: 'layField', tiles: [] };

  it('previews the hovered tile before the drag starts', () => {
    const evaluation = evaluateTool(laying, { state: farmCity, tile: { x: 50, y: 52 }, rotation: null });
    expect(evaluation.ghost.tiles).toEqual([{ x: 50, y: 52 }]);
    expect(evaluation.valid).toBe(true);
    expect(evaluation.cost).toBe(5);
  });

  it('fills the gap between two pointer positions of a fast drag, without duplicates', () => {
    const started = extendBrush(laying, { x: 50, y: 52 });
    const dragged = extendBrush(extendBrush(started, { x: 53, y: 52 }), { x: 52, y: 52 });
    expect(dragged.kind === 'brush' && dragged.tiles).toEqual([{ x: 50, y: 52 }, { x: 51, y: 52 }, { x: 52, y: 52 }, { x: 53, y: 52 }]);
  });

  it('lays Fields over every dragged tile, pricing only the tiles that can be laid', () => {
    const tool: Tool = { kind: 'brush', action: 'layField', tiles: [{ x: 50, y: 52 }, { x: 51, y: 52 }, { x: 50, y: 50 }] };
    const evaluation = evaluateTool(tool, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(evaluation.command).toEqual({ type: 'LayFields', tiles: tool.tiles });
    expect(evaluation.cost).toBe(10);
    expect(evaluation.valid).toBe(true);
  });

  it('is invalid when nothing under the brush can be laid', () => {
    const tool: Tool = { kind: 'brush', action: 'layField', tiles: [{ x: 50, y: 50 }] };
    const evaluation = evaluateTool(tool, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(evaluation.valid).toBe(false);
    expect(evaluation.issue).toBe('error.tilesOccupied');
  });

  it('plants the selected species and explains an empty seed stock', () => {
    const tiles = [{ x: 50, y: 50 }, { x: 51, y: 50 }];
    const planting = evaluateTool({ kind: 'brush', action: 'plant', crop: 'wheat', tiles }, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(planting.command).toEqual({ type: 'Plant', crop: 'wheat', tiles });
    expect(planting.valid).toBe(true);
    const noSeeds = evaluateTool({ kind: 'brush', action: 'plant', crop: 'grass', tiles }, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(noSeeds.issue).toBe('error.noSeeds');
  });

  it('removes fields with the matching command', () => {
    const tiles = [{ x: 50, y: 50 }];
    expect(evaluateTool({ kind: 'brush', action: 'removeField', tiles }, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null }).command).toEqual({ type: 'RemoveFields', tiles });
  });

  it('sends the command when the drag ends and keeps the tool with an empty brush', () => {
    const tool: Tool = { kind: 'brush', action: 'layField', tiles: [{ x: 50, y: 52 }] };
    const current = evaluateTool(tool, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(confirmTool(tool, { x: 50, y: 52 }, current)).toEqual({ command: current.command, nextTool: { ...tool, tiles: [] } });
  });

  it('drops an invalid drag but keeps the tool', () => {
    const tool: Tool = { kind: 'brush', action: 'layField', tiles: [{ x: 50, y: 50 }] };
    const current = evaluateTool(tool, { state: farmCity, tile: { x: 0, y: 0 }, rotation: null });
    expect(confirmTool(tool, { x: 50, y: 50 }, current)).toEqual({ command: null, nextTool: { ...tool, tiles: [] } });
  });
});
