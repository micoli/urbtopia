import type { Building } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { VenueTutorialReplay } from '../tutorial/VenueTutorialReplay';
import { VenueTakings } from './VenueTakings';

interface VenuePanelProps {
  building: Building;
}

export function VenuePanel({ building }: VenuePanelProps) {
  return (
    <DrawerPanel>
      <ActionButton variant="primary" block onClick={() => venueStore.getState().open(building.id)}>
        <Icon name="build" /> {t(`interior.open.${building.type}` as MessageKey)}
      </ActionButton>
      <VenueTakings building={building} />
      <VenueTutorialReplay building={building} />
    </DrawerPanel>
  );
}
