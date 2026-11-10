import { t } from '../../i18n/t';
import type { VenuePanelId } from '../../store/venueStore';

const TITLES = { staff: 'venue.staff', menu: 'venue.menu', events: 'venue.events', takings: 'venue.takings', parquet: 'home.interior.parquet' } as const;

// The title of the panels opened beside the room; the build menu carries its own.
export function venuePanelTitle(panel: VenuePanelId | null): string | undefined {
  return panel && panel !== 'build' ? t(TITLES[panel]) : undefined;
}
