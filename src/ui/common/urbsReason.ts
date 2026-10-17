import { t } from '../../i18n/t';

export function urbsReason(urbs: number, cost: number): string | null {
  return urbs < cost ? t('blocked.urbs').replace('{cost}', String(cost)) : null;
}
