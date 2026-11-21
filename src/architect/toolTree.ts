import { DECORS, DOOR_BRICKS, WINDOW_BRICKS } from '../core/architect/housePlan.ts';
import { ROOF_TOOLS } from './editorConstants.ts';
import type { FacadeTool } from './facadeTools.ts';

export interface ToolGroup {
  id: 'wall' | 'windows' | 'doors' | 'balconies' | 'decors' | 'roof';
  tools: FacadeTool[];
}

// The tools of the facade tab by type: the first level of the tree is the type, the second one its styles.
const GROUPS: ToolGroup[] = [
  { id: 'wall', tools: ['wall'] },
  { id: 'windows', tools: [...WINDOW_BRICKS, 'bay'] },
  { id: 'doors', tools: DOOR_BRICKS },
  { id: 'balconies', tools: ['balcony', 'balconyDoor'] },
  { id: 'decors', tools: DECORS },
  { id: 'roof', tools: ROOF_TOOLS },
];

// The groups with the tools the level being edited offers; a group without any is left out.
export function toolTree(available: FacadeTool[]): ToolGroup[] {
  return GROUPS.map((group) => ({ ...group, tools: group.tools.filter((tool) => available.includes(tool)) })).filter((group) => group.tools.length > 0);
}
