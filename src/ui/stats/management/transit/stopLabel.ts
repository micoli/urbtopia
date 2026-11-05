import type { Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';

export function stopTitle(stop: Building | undefined, id: number): string {
  if (!stop) return `#${id}`;
  if (stop.name) return stop.name;
  return `${t(`building.${stop.type}`)} #${id}`;
}

// A plain string, for the places that cannot hold a link, such as the options of a list.
export function stopLabel(stop: Building | undefined, id: number): string {
  if (!stop || stop.name) return stopTitle(stop, id);
  return `${stopTitle(stop, id)} (${stop.x}, ${stop.y})`;
}
