import type { SanctionedHome } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

export function sanctionBadgeText({ sanction }: SanctionedHome): string {
  return t('sanction.badge')
    .replace('{factor}', t(`needs.factor.${sanction.factor}` as MessageKey))
    .replace('{percent}', String(Math.round(100 * (1 - sanction.multiplier))));
}
