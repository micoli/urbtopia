import { dispatch } from '../engine/dispatch';
import type { Command } from '../engine/commands';
import type { BuildingType, GameState } from '../engine/state';
import type { Coord } from '../map/coord';

// The three levels that most demonstrations come in; a few add an expert one that ends on a whole layout.
export type GuidedLevel = 'simple' | 'intermediate' | 'advanced';

export type DemonstrationText = readonly [english: string, french: string];
export interface DemonstrationStep {
  id: string;
  title: DemonstrationText;
  objective: DemonstrationText;
  action: DemonstrationText;
  explanation: DemonstrationText;
  result: DemonstrationText;
  commands?: readonly Command[];
  highlight?: readonly Coord[];
  camera?: { x: number; y: number; zoom: number };
  check: (state: GameState) => void;
}
export interface Demonstration {
  id: string;
  buildingType: BuildingType;
  buildingId: number;
  level: GuidedLevel | 'expert';
  title: DemonstrationText;
  objective: DemonstrationText;
  initial: () => GameState;
  steps: readonly DemonstrationStep[];
}
export interface DemonstrationCheckpoint {
  step: DemonstrationStep;
  state: GameState;
}

// Build each step from a fixed seed and semantic commands, never from the viewer's City.
export function compileDemonstration(scenario: Demonstration): readonly DemonstrationCheckpoint[] {
  if (scenario.steps.length === 0) throw new Error(`${scenario.id}: no steps`);
  let state = scenario.initial();
  const ids = new Set<string>();
  return scenario.steps.map((step, index) => {
    try {
      if (ids.has(step.id)) throw new Error('duplicate step id');
      ids.add(step.id);
      for (const command of step.commands ?? []) {
        const outcome = dispatch(state, command, state.lastSeen);
        if (!outcome.ok) throw new Error(outcome.error.key);
        state = outcome.state;
      }
      step.check(state);
      return { step, state: structuredClone(state) };
    } catch (cause) {
      throw new Error(`${scenario.id} · step ${index + 1} (${step.id}): ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    }
  });
}
