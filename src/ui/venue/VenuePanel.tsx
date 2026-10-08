import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { VenueTakings } from './VenueTakings';

interface VenuePanelProps {
  building: Building;
}

export function VenuePanel({ building }: VenuePanelProps) {
  return (
    <DrawerPanel>
      <ActionButton variant="primary" block onClick={() => venueStore.getState().open(building.id)}>
        {t('venue.manage')}
      </ActionButton>
      <VenueTakings building={building} />
    </DrawerPanel>
  );
}
