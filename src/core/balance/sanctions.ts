import sanctions from '../../../assets/defs/balance/sanctions.json' with { type: 'json' };
import type { Difficulty } from '../engine/difficulty';
import type { SanctionableFactorId } from '../environment/needFactors';

export interface DifficultyRule {
  readonly factors: readonly SanctionableFactorId[];
  readonly taxFloor: number;
  readonly citizenLossSeverity: number;
}

export const SANCTIONS: Readonly<Record<Difficulty, DifficultyRule>> = sanctions.difficulties as Record<Difficulty, DifficultyRule>;

export function sanctionedFactors(difficulty: Difficulty): readonly SanctionableFactorId[] {
  return SANCTIONS[difficulty].factors;
}
