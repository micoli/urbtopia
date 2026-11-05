import { ANNUAL_EVENT_ENTRIES, annualEventWindow, civilDateOf, localDayOf, type AnnualEventId, type AnnualEventWindow, type BuildingType, type GameState } from '../core';
import { BUILDING_ENTRIES } from '../core/buildings/buildingDefinitions';

export type AnnualEventStatus = 'open' | 'upcoming';

export interface AnnualEventFigure {
  id: AnnualEventId;
  window: AnnualEventWindow;
  status: AnnualEventStatus;
  daysUntilOpen: number;
  items: readonly BuildingType[];
}

// The window of the year that is open today or, failing that, the next one to open.
function nextWindowOf(event: (typeof ANNUAL_EVENT_ENTRIES)[number], today: number): AnnualEventWindow {
  const year = civilDateOf(today).year;
  const windows = [year - 1, year, year + 1].map(candidate => annualEventWindow(event, candidate));
  return windows.find(({ endDay }) => endDay >= today)!;
}

export function annualEventsFigures(state: GameState): AnnualEventFigure[] {
  const today = localDayOf(state.lastSeen);
  return ANNUAL_EVENT_ENTRIES.map(event => {
    const window = nextWindowOf(event, today);
    return {
      id: event.id,
      window,
      status: window.startDay <= today ? 'open' as const : 'upcoming' as const,
      daysUntilOpen: Math.max(0, window.startDay - today),
      items: BUILDING_ENTRIES.filter(entry => entry.annualEvent === event.id && !entry.retired).map(entry => entry.id),
    };
  }).sort((a, b) => a.window.startDay - b.window.startDay);
}
