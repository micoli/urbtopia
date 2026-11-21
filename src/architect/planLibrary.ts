import type { Plan } from '../core/architect/housePlan.ts';

// Where the plans of the player are kept: the city in the game, the browser storage in the standalone page.
export interface PlanLibrary {
  names: readonly string[];
  load: (name: string) => Plan | undefined;
  save: (name: string, plan: Plan) => void;
  remove: (name: string) => void;
  // The houses of the city built from a plan, in the game only.
  houseCount?: (name: string) => number;
}
