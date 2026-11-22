import type { Difficulty } from '../engine/difficulty';
import type { GameEvent } from '../engine/events';
import type { Command } from '../engine/commands';
import type { GameState } from '../engine/state';
import type { CounterId } from './counters';

export const ACHIEVEMENT_CATEGORIES = ['production', 'housing', 'transport', 'interiors', 'energy', 'politics', 'architect', 'leisure', 'environment'] as const;
export type AchievementCategoryId = (typeof ACHIEVEMENT_CATEGORIES)[number];

// What the player does outside the game state, which the interface reports with a Signal Command.
export const ACHIEVEMENT_SIGNALS = ['interiorOpened', 'demonstrationFinished', 'landValueOpened'] as const;
export type AchievementSignal = (typeof ACHIEVEMENT_SIGNALS)[number];

// The closed set of ways an Achievement is raised; each is judged between the state before a Command or a simulation step and the state after it.
export type AchievementTrigger =
  // A counter of what the City holds grows.
  | { readonly type: 'created'; readonly counter: CounterId }
  // A counter reaches a value.
  | { readonly type: 'threshold'; readonly counter: CounterId; readonly atLeast: number }
  // One of these Commands is applied.
  | { readonly type: 'command'; readonly commands: readonly Command['type'][] }
  // The simulation, or a Command, announces an event.
  | { readonly type: 'sim'; readonly event: GameEvent['type'] }
  // The interface reports that the player did something.
  | { readonly type: 'signal'; readonly signal: AchievementSignal };

// The features that ship switched off, named by the flags of the game.
export type AchievementFlag = 'clubs' | 'architect' | 'advisor';

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
  // The beta feature it needs: it only counts for a player who switched that feature on.
  readonly flag?: AchievementFlag;
}

export interface TriggerContext {
  readonly before: GameState;
  readonly after: GameState;
  readonly events: readonly GameEvent[];
  // The Command that led to `after`; absent for a tick of the simulation.
  readonly command?: Command;
}
