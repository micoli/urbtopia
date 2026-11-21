import { DECORS, GROUND_DECORS, BRICKS, dormerAllowed, exteriorEdges, isDoorBrick, type Brick, type Decor, type Plan } from '../core/architect/housePlan.ts';
import { ROOF_TOOLS, type RoofTool } from './editorConstants.ts';

export type FacadeTool = Brick | Decor | RoofTool;

export const isRoofTool = (tool: FacadeTool): tool is RoofTool => ROOF_TOOLS.includes(tool as RoofTool);
export const isDecorTool = (tool: FacadeTool): tool is Decor => DECORS.includes(tool as Decor);

// What can be added on the level being edited: the bricks or, in the decor sub-mode, the decors. Doors and what stands in front of the facade
// only on the ground floor, dormers only under a mansard.
export function availableTools(plan: Plan, floor: number, roofLevel: boolean, decors = false): FacadeTool[] {
  if (!roofLevel) return decors ? DECORS.filter((decor) => floor === 0 || !GROUND_DECORS.includes(decor)) : BRICKS.filter((brick) => !isDoorBrick(brick) || floor === 0);
  const dormers = exteriorEdges(plan).some((edge) => dormerAllowed(plan, edge));
  return ROOF_TOOLS.filter((tool) => dormers || (tool !== 'dormer' && tool !== 'roundDormer'));
}

// The tool the player picked, or the first one the level offers when the pick no longer fits.
export function effectiveTool(plan: Plan, floor: number, roofLevel: boolean, facade: Brick | Decor, roofTool: RoofTool): FacadeTool {
  const wanted = roofLevel ? roofTool : facade;
  const available = availableTools(plan, floor, roofLevel, isDecorTool(facade));
  return available.includes(wanted) ? wanted : available[0]!;
}
