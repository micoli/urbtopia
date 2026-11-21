import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { architectStore } from '../../store/architectStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { Note } from '../common/Note';

interface ArchitectPanelProps {
  building: Building;
}

export function ArchitectPanel({ building }: ArchitectPanelProps) {
  const enabled = useFeatureFlag('architect');
  const open = () => {
    architectStore.getState().open(building.id);
    uiStore.getState().select(null);
  };
  if (!enabled) return null;
  return (
    <DrawerPanel>
      <Note>{t('architect.office.intro')}</Note>
      <ActionButton variant="primary" block onClick={open}><Icon name="build" /> {t('architect.office.open')}</ActionButton>
    </DrawerPanel>
  );
}
