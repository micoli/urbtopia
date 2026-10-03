import { t } from '../i18n/t';
import type { ServiceKey } from '../core';

export function serviceName(key: ServiceKey): string {
  return t(`building.${key}`);
}
