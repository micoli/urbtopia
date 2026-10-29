import { useStore } from 'zustand';
import { FIXTURES } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';

// A reminder, while an item is being placed and the menu is closed: what to do and how to cancel.
export function VenuePlacementHint() {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const moving = useStore(venueStore, store => store.movingId);
  if (!selected && moving === null) return null;
  return (
    <p className="venue-hint" role="status">
      {selected ? `${t(`venue.fixture.${selected}`)} · ${FIXTURES[selected].price} ` : ''}
      {moving !== null ? t('venue.moveHint') : t('venue.placeHint')}
      {' '}
      <ActionButton size="xs" onClick={() => (moving !== null ? venueStore.getState().stopMove() : venueStore.getState().selectFixture(null))}>{t('venue.cancel')}</ActionButton>
    </p>
  );
}
