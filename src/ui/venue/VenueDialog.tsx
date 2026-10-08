import { useEffect } from 'react';
import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { venueStore } from '../../store/venueStore';
import { CloseButton } from '../common/CloseButton';
import { useGame } from '../common/hooks';
import { VenueBuildMenu } from './VenueBuildMenu';
import { VenueCanvas } from './VenueCanvas';
import { VenueFixtureActions } from './VenueFixtureActions';
import { VenueStaff } from './VenueStaff';
import { VenueTakings } from './VenueTakings';

export function VenueDialog() {
  const venueId = useStore(venueStore, store => store.venueId);
  const close = useStore(venueStore, store => store.close);
  const venue = useGame(store => (venueId === null ? undefined : store.state.buildings.find(building => building.id === venueId)));
  const open = venueId !== null && venue !== undefined;

  useEffect(() => {
    if (!open) return;
    sceneHandle.current?.setPaused(true);
    return () => sceneHandle.current?.setPaused(false);
  }, [open]);

  if (!open) return null;
  return (
    <div className="venue-view" role="dialog" aria-modal="true" aria-label={t('venue.manage')}>
      <VenueCanvas venueId={venueId} />
      <header className="venue-view__header">
        <h2>{t(`building.${venue.type}`)}</h2>
        <CloseButton onClick={close} label={t('venue.back')} />
      </header>
      <aside className="venue-view__side">
        <VenueFixtureActions venueId={venue.id} />
        <VenueBuildMenu tier={venue.tier} />
        <VenueStaff venueId={venue.id} />
        <section className="venue-takings">
          <h3>{t('venue.takings')}</h3>
          <VenueTakings building={venue} editable />
        </section>
      </aside>
    </div>
  );
}
