import type { Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';

export function stopLabel(stop: Building | undefined, id: number): string {
  if (!stop) return `#${id}`;
  if (stop.name) return stop.name;
  return `${t(`building.${stop.type}`)} #${id} (${stop.x}, ${stop.y})`;
}
