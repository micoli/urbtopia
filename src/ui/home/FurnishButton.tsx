import { HOME_INTERIOR, isHomeInteriorUnlocked, isHomeType, type Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { useGame } from '../common/hooks';
import { Icon } from '../common/Icon';

interface FurnishButtonProps {
  building: Building;
}

// Opens the interior of a Home in the same view as the interior of a Venue.
export function FurnishButton({ building }: FurnishButtonProps) {
  const unlocked = useGame(store => isHomeInteriorUnlocked(store.state));
  if (!isHomeType(building.type)) return null;
  return (
    <>
      <ActionButton block disabled={!unlocked} onClick={() => venueStore.getState().open(building.id)}>
        <Icon name="build" /> {t('home.interior.open')}
      </ActionButton>
      {unlocked ? null : <BlockedReason reason={t('blocked.furnish').replace('{citizens}', String(HOME_INTERIOR.unlockCitizens))} />}
    </>
  );
}
