import { ROOF_TOOLS, type RoofTool } from './editorConstants.ts';
import { BRICKS, dormerAllowed, exteriorEdges, type Brick, type Plan } from '../core/architect/housePlan.ts';

export type FacadeTool = Brick | RoofTool;

export const isRoofTool = (tool: FacadeTool): tool is RoofTool => ROOF_TOOLS.includes(tool as RoofTool);

// What can be added on the level being edited: doors only on the ground floor, dormers only under a mansard.
export function availableTools(plan: Plan, floor: number, roofLevel: boolean): FacadeTool[] {
  if (!roofLevel) return BRICKS.filter((brick) => brick !== 'door' || floor === 0);
  const dormers = exteriorEdges(plan).some((edge) => dormerAllowed(plan, edge));
  return ROOF_TOOLS.filter((tool) => tool !== 'dormer' || dormers);
}

// The tool the player picked, or the first one the level offers when the pick no longer fits.
export function effectiveTool(plan: Plan, floor: number, roofLevel: boolean, brick: Brick, roofTool: RoofTool): FacadeTool {
  const wanted = roofLevel ? roofTool : brick;
  const available = availableTools(plan, floor, roofLevel);
  return available.includes(wanted) ? wanted : available[0]!;
}
