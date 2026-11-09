import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

interface FloorButtonProps {
  building: Building;
}

// Opens the Factory floor in the same view as the interior of a Venue.
export function FloorButton({ building }: FloorButtonProps) {
  if (building.type !== 'factory') return null;
  return (
    <ActionButton variant="primary" block onClick={() => venueStore.getState().open(building.id)}>
      <Icon name="build" /> {t('factory.floor.open')}
    </ActionButton>
  );
}
