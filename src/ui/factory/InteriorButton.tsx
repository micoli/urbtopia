import { hasProductionInterior, hasServiceInterior, interiorUnlockCitizensOf, isInteriorUnlocked, type Building } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { useGame } from '../common/hooks';
import { Icon } from '../common/Icon';

interface InteriorButtonProps {
  building: Building;
}

// Opens the interior of a Factory, a Packhouse, a Mill, a Bakery, a Dairy, a Storehouse, a School, a Library or a Hospital in the same view as the interior of a Venue. They open once the city has enough Citizens.
export function InteriorButton({ building }: InteriorButtonProps) {
  const unlocked = useGame(store => isInteriorUnlocked(store.state, building.type));
  if (!hasProductionInterior(building) && !hasServiceInterior(building)) return null;
  return (
    <>
      <ActionButton variant="primary" block disabled={!unlocked} onClick={() => venueStore.getState().open(building.id)}>
        <Icon name="build" /> {t(`interior.open.${building.type}` as MessageKey)}
      </ActionButton>
      {unlocked ? null : <BlockedReason reason={t('blocked.interior').replace('{citizens}', String(interiorUnlockCitizensOf(building.type)))} />}
    </>
  );
}
