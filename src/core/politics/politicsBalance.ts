import politics from '../../../assets/defs/balance/politics.json' with { type: 'json' };
import type { Difficulty } from '../engine/difficulty';

export interface PoliticsDifficultyRule {
  readonly active: boolean;
  readonly demonstrations: boolean;
  readonly election: boolean;
  readonly approvalWeighsOnGrants: boolean;
  readonly approvalWeighsOnCouncil: boolean;
}

export const POLITICS = politics;

export const politicsRuleOf = (difficulty: Difficulty): PoliticsDifficultyRule => POLITICS.difficulties[difficulty];
