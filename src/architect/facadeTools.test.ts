import { describe, expect, it } from 'vitest';
import { DECORS, DOOR_BRICKS, GROUND_DECORS, addFloor, newPlan, setAllRoofs } from '../core/architect/housePlan.ts';
import { availableTools, effectiveTool, isDecorTool, isRoofTool } from './facadeTools.ts';
import { toolTree } from './toolTree.ts';

const plan = () => {
  const house = newPlan('rect');
  addFloor(house);
  return house;
};

describe('the tools of the facade tab', () => {
  it('offers the bricks, with the doors on the ground floor only', () => {
    const house = plan();
    const ground = availableTools(house, 0, false);
    const upper = availableTools(house, 1, false);
    for (const door of DOOR_BRICKS) {
      expect(ground).toContain(door);
      expect(upper).not.toContain(door);
    }
    expect(ground).toContain('windowArched');
    expect(upper).toContain('windowArched');
    expect(ground.some(isDecorTool)).toBe(false);
  });

  it('offers the decors in their sub-mode, what stands in front of the facade on the ground floor only', () => {
    const house = plan();
    expect(availableTools(house, 0, false, true)).toEqual(DECORS);
    const upper = availableTools(house, 1, false, true);
    for (const decor of GROUND_DECORS) expect(upper).not.toContain(decor);
    expect(upper).toContain('awning');
    expect(upper).toContain('pilasters');
  });

  it('offers the dormers under a mansard only, and the chimney always', () => {
    const house = plan();
    expect(availableTools(house, 1, true)).toEqual(['chimney']);
    setAllRoofs(house, 'mansard');
    const tools = availableTools(house, 1, true);
    expect(tools).toEqual(['dormer', 'roundDormer', 'chimney']);
    expect(tools.every(isRoofTool)).toBe(true);
  });

  it('keeps the tool picked, or falls back to the first one the level offers', () => {
    const house = plan();
    expect(effectiveTool(house, 0, false, 'doorGarage', 'dormer')).toBe('doorGarage');
    expect(effectiveTool(house, 1, false, 'doorGarage', 'dormer')).toBe('wall');
    expect(effectiveTool(house, 1, false, 'portico', 'dormer')).toBe('awning');
    expect(effectiveTool(house, 1, true, 'window', 'dormer')).toBe('chimney');
  });
});

describe('the tree of the tools', () => {
  it('groups the bricks by type, the type being the first level', () => {
    const groups = toolTree(availableTools(plan(), 0, false));
    expect(groups.map((group) => group.id)).toEqual(['wall', 'windows', 'doors', 'balconies']);
    expect(groups.find((group) => group.id === 'windows')!.tools).toEqual(['window', 'windowArched', 'windowShutters', 'windowRound', 'bay']);
    expect(groups.find((group) => group.id === 'doors')!.tools).toEqual(DOOR_BRICKS);
    expect(groups.find((group) => group.id === 'wall')!.tools).toEqual(['wall']);
  });

  it('keeps the decors for their sub-mode and the roof tools for the roof level', () => {
    const house = plan();
    expect(toolTree(availableTools(house, 0, false, true)).map((group) => group.id)).toEqual(['decors']);
    expect(toolTree(availableTools(house, 1, true)).map((group) => group.id)).toEqual(['roof']);
  });

  it('leaves out a group with no tool on the level', () => {
    const groups = toolTree(availableTools(plan(), 1, false));
    expect(groups.map((group) => group.id)).not.toContain('doors');
  });
});
