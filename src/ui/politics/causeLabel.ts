import type { PetitionCause } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const NEED_FACTOR_CAUSES: readonly PetitionCause[] = ['electricity', 'pollution', 'congestion', 'waste'];

// What a Petition is about, in the player's words: the Need it names or the Public facility its district lacks.
export function causeLabel(cause: PetitionCause): string {
  if (NEED_FACTOR_CAUSES.includes(cause)) return t(`needs.factor.${cause}` as MessageKey);
  return t(`building.${cause}` as MessageKey);
}
