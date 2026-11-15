import { useStore } from 'zustand';
import { fixtureWallOf, FIXTURES } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';

// A reminder, while an item is being placed and the menu is closed: what to do and how to cancel.
export function VenuePlacementHint() {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const moving = useStore(venueStore, store => store.movingId);
  const venueId = useStore(venueStore, store => store.venueId);
  const movingType = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return (building?.interior?.fixtures ?? building?.venue?.fixtures)?.find(fixture => fixture.id === moving)?.type;
  });
  const type = selected ?? movingType;
  const wall = type ? fixtureWallOf(type) : undefined;
  if (!selected && moving === null) return null;
  return (
    <p className="venue-hint" role="status">
      <span>
        {selected ? `${t(`venue.fixture.${selected}`)} · ${FIXTURES[selected].price} ` : ''}
        {moving !== null ? t('venue.moveHint') : t('venue.placeHint')}
        {wall ? <span className="venue-hint__constraint">{t(`venue.placeWall.${wall}`)}</span> : null}
      </span>
      {' '}
      <ActionButton size="xs" onClick={() => (moving !== null ? venueStore.getState().stopMove() : venueStore.getState().selectFixture(null))}>{t('venue.cancel')}</ActionButton>
    </p>
  );
}
