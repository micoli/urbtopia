import { marinaCapacity, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';

interface MarinaPanelProps {
  building: Building;
}

export function MarinaPanel({ building }: MarinaPanelProps) {
  return (
    <DrawerPanel>
      <p>⚓ {t('marina.capacity')}: {marinaCapacity(building)}</p>
      <DrawerPanel.Upgrade building={building} />
    </DrawerPanel>
  );
}
