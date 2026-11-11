import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

interface InteriorButtonProps {
  building: Building;
}

// Opens the Factory interior or the Packhouse interior in the same view as the interior of a Venue.
export function InteriorButton({ building }: InteriorButtonProps) {
  if (building.type !== 'factory' && building.type !== 'packhouse') return null;
  return (
    <ActionButton variant="primary" block onClick={() => venueStore.getState().open(building.id)}>
      <Icon name="build" /> {t('factory.interior.open')}
    </ActionButton>
  );
}
