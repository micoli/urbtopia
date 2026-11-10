import { isHomeType, type Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

interface FurnishButtonProps {
  building: Building;
}

// Opens the interior of a Home in the same view as the interior of a Venue.
export function FurnishButton({ building }: FurnishButtonProps) {
  if (!isHomeType(building.type)) return null;
  return (
    <ActionButton block onClick={() => venueStore.getState().open(building.id)}>
      <Icon name="build" /> {t('home.interior.open')}
    </ActionButton>
  );
}
