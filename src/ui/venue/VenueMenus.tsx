import { useStore } from 'zustand';
import type { Building } from '../../core';
import { prefsStore, type Layout } from '../../i18n/prefsStore';
import { BottomBar } from '../layout/BottomBar';
import { Dock } from '../layout/Dock';
import { RadialMenu } from '../layout/RadialMenu';
import { TopBar } from '../layout/TopBar';
import { VenueFlyout } from './VenueFlyout';
import { VenuePlacementHint } from './VenuePlacementHint';
import { VenueMinimalStats } from './VenueMinimalStats';
import { VenueSheet } from './VenueSheet';
import { VenueSidePanel } from './VenueSidePanel';
import { VenueStats } from './VenueStats';
import { useVenueActions } from './useVenueActions';

interface VenueMenusProps {
  venue: Building;
  layout?: Layout;
}

// The main menu of the interior follows the layout chosen in the settings, as the main menu of the city does.
export function VenueMenus({ venue, layout: forced }: VenueMenusProps) {
  const chosen = useStore(prefsStore, store => store.layout);
  const layout = forced ?? chosen;
  const actions = useVenueActions();
  if (layout === 'A') {
    return (
      <>
        <VenuePlacementHint />
        <TopBar><VenueStats venue={venue} /></TopBar>
        <VenueSheet venue={venue} />
        <BottomBar actions={actions} />
      </>
    );
  }
  if (layout === 'B') {
    return (
      <>
        <VenuePlacementHint />
        <VenueMinimalStats venue={venue} />
        <VenueSheet venue={venue} />
        <RadialMenu actions={actions} />
      </>
    );
  }
  return (
    <>
      <VenuePlacementHint />
      <Dock actions={actions} header={<VenueStats venue={venue} />} bottomId="back" />
      <VenueFlyout venue={venue} />
      <VenueSidePanel venueId={venue.id} />
    </>
  );
}
