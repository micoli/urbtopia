import { useStore } from 'zustand';
import { hasProductionInterior, hasServiceInterior, isVenue, type Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { PanelHeader } from '../common/PanelHeader';
import { VenueFixturePanel } from './VenueFixturePanel';
import { InteriorManagement } from '../factory/InteriorManagement';
import { InteriorStaff } from '../factory/InteriorStaff';
import { InteriorParquet } from './InteriorParquet';
import { VenuePanelContent } from './VenuePanelContent';
import { useVenueFixtureExpansion } from './useVenueFixtureExpansion';
import { VenueFixtureMiniBar } from './VenueFixtureMiniBar';
import { venuePanelTitle } from './venuePanelTitle';

interface VenueSidePanelProps {
  venue: Building;
}

// The right panel of the side bar layout, as the panel of a building in the city: the selected Fixture, or the staff, the
// events or the takings. Only one is open at a time.
export function VenueSidePanel({ venue }: VenueSidePanelProps) {
  const panel = useStore(venueStore, store => store.panel);
  const closePanel = useStore(venueStore, store => store.closePanel);
  const { fixtureType, open: fixtureOpen, expand } = useVenueFixtureExpansion(venue.id);
  const title = venuePanelTitle(panel);
  if (fixtureType !== null && !fixtureOpen) {
    return (
      <div className="side-panel-mini">
        <VenueFixtureMiniBar fixtureType={fixtureType} onExpand={expand} />
      </div>
    );
  }
  if (fixtureOpen) {
    return (
      <aside className="side-panel">
        <VenueFixturePanel venueId={venue.id} />
      </aside>
    );
  }
  if (!title) return null;
  return (
    <aside className="side-panel">
      <PanelHeader title={title} onClose={closePanel} debugNode={venue} />
      {panel === 'management' && !isVenue(venue) ? <InteriorManagement factory={venue} /> : panel === 'parquet' ? <InteriorParquet building={venue} /> : hasProductionInterior(venue) || hasServiceInterior(venue) ? <InteriorStaff factory={venue} /> : <VenuePanelContent venue={venue} />}
    </aside>
  );
}
