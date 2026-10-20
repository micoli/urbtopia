import { OFFICE, officeUrbsDue, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { PowerShortageNote } from './PowerShortageNote';
import { useFilledJobs } from './useFilledJobs';

interface OfficePanelProps {
  building: Building;
}

export function OfficePanel({ building }: OfficePanelProps) {
  const filled = useFilledJobs(building);
  const due = officeUrbsDue(building);
  return <DrawerPanel>
      <PowerShortageNote />
      <DrawerPanel.LabelValue label={t('office.income')} value={`${filled * OFFICE.urbsPerJobPerHour} / h`} />
      <DrawerPanel.LabelValue label={t('office.due')} value={due} />
      {due > 0 ? (
        <ActionButton variant="primary" block onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
