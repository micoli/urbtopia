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
