import { SANCTIONS, sanctionedFactors, type Difficulty } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

export function difficultyDescription(difficulty: Difficulty): string {
  const factors = sanctionedFactors(difficulty);
  if (factors.length === 0) return t('difficulty.none');
  return t('difficulty.sanctions')
    .replace('{percent}', String(Math.round(100 * (1 - SANCTIONS[difficulty].taxFloor))))
    .replace('{factors}', factors.map(factor => t(`needs.factor.${factor}` as MessageKey)).join(', '));
}
