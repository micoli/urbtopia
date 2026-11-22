import type { GameState } from '../engine/state';
import type { AchievementTrigger, CreatedCollection, TriggerContext } from './achievementTypes';

function countOf(state: GameState, collection: CreatedCollection, mode?: string): number {
  const items = state[collection] ?? [];
  if (!mode) return items.length;
  return items.filter((item) => 'mode' in item && item.mode === mode).length;
}

export function isRaised(trigger: AchievementTrigger, { before, after }: TriggerContext): boolean {
  return countOf(after, trigger.collection, trigger.mode) > countOf(before, trigger.collection, trigger.mode);
}

// What the state of a City proves about a trigger, without the Command that raised it; a trigger the state cannot prove returns false.
export function isProvenBy(trigger: AchievementTrigger, state: GameState): boolean {
  return countOf(state, trigger.collection, trigger.mode) > 0;
}
