import { BUILDING_ENTRIES, definitionOf } from '../buildings/buildingDefinitions';
import type { BuildingType } from '../engine/state';
import { isAnnualEventOpen, type AnnualEventId } from './annualEvents';

export const annualEventOf = (type: BuildingType): AnnualEventId | undefined => definitionOf(type).annualEvent as AnnualEventId | undefined;

// An Annual event item can only be newly built while a window of its event is open; every other building always can.
export const isBuildableAt = (type: BuildingType, now: number): boolean => {
  const event = annualEventOf(type);
  return event === undefined || isAnnualEventOpen(event, now);
};

// The events that have at least one item to build: only those announce themselves.
export const annualEventsWithItems = (): ReadonlySet<AnnualEventId> =>
  new Set(BUILDING_ENTRIES.flatMap(entry => (entry.annualEvent && !entry.retired ? [entry.annualEvent as AnnualEventId] : [])));
