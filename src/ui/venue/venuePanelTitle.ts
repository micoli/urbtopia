import { t } from '../../i18n/t';
import type { VenuePanelId } from '../../store/venueStore';

const TITLES = { staff: 'venue.staff', events: 'venue.events', takings: 'venue.takings' } as const;

// The title of the panels opened beside the room; the build menu carries its own.
export function venuePanelTitle(panel: VenuePanelId | null): string | undefined {
  return panel && panel !== 'build' ? t(TITLES[panel]) : undefined;
}
