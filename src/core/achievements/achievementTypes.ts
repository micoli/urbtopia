import type { Difficulty } from '../engine/difficulty';
import type { GameEvent } from '../engine/events';
import type { GameState, NetworkMode } from '../engine/state';

export const ACHIEVEMENT_CATEGORIES = ['transport'] as const;
export type AchievementCategoryId = (typeof ACHIEVEMENT_CATEGORIES)[number];

export type CreatedCollection = 'roads' | 'pedestrianWays' | 'bridges' | 'busLines' | 'brtRoads' | 'transitLines';

// The closed set of ways an Achievement is raised; each is judged between the state before a Command or a simulation step and the state after it.
export type AchievementTrigger = { readonly type: 'created'; readonly collection: CreatedCollection; readonly mode?: NetworkMode };

export interface LocalizedText {
  readonly en: string;
  readonly fr: string;
}

export interface AchievementDef {
  readonly id: string;
  readonly category: AchievementCategoryId;
  readonly trigger: AchievementTrigger;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  // The Citizens the City needs before the feature exists.
  readonly unlockCitizens?: number;
  // The lowest Difficulty that has the feature.
  readonly fromDifficulty?: Difficulty;
}

export interface TriggerContext {
  readonly before: GameState;
  readonly after: GameState;
  readonly events: readonly GameEvent[];
}
