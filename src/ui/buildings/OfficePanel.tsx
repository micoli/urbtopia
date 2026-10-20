import { OFFICE, officeUrbsDue, officeYieldMultiplierOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { PowerShortageNote } from './PowerShortageNote';
import { useGame } from '../common/hooks';
import { useFilledJobs } from './useFilledJobs';

interface OfficePanelProps {
  building: Building;
}

export function OfficePanel({ building }: OfficePanelProps) {
  const filled = useFilledJobs(building);
  const yieldMultiplier = useGame((store) => officeYieldMultiplierOf(store.state));
  const due = officeUrbsDue(building, yieldMultiplier);
  return <DrawerPanel>
      <PowerShortageNote />
      <DrawerPanel.LabelValue label={t('office.income')} value={`${filled * OFFICE.urbsPerJobPerHour * yieldMultiplier} / h`} />
      <DrawerPanel.LabelValue label={t('office.due')} value={due} />
      {due > 0 ? (
        <ActionButton variant="primary" block onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
