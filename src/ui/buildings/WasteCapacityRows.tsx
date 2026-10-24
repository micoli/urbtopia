import { wasteCitizensServedBy, wasteFacilityFigures, type WasteCapacityLoss } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';

interface WasteCapacityRowsProps {
  facilityId: number;
}

function lossReason(loss: WasteCapacityLoss, powerRatio: number): string {
  if (loss === 'noUrbs') return t('facility.waste.loss.noUrbs');
  if (loss === 'powerShortage') return t('facility.waste.loss.powerShortage');
  return t('facility.waste.loss.powerReduced').replace('{percent}', String(Math.round(powerRatio * 100)));
}

export function WasteCapacityRows({ facilityId }: WasteCapacityRowsProps) {
  const state = useGame(s => s.state);
  const figures = wasteFacilityFigures(state, facilityId);
  if (!figures) return null;
  const served = wasteCitizensServedBy(state, facilityId);
  return <>
    <DrawerPanel.LabelValue label={t('facility.wasteCapacity')} value={figures.nominalCapacity}/>
    {figures.loss && <DrawerPanel.LabelValue tone="warn" label={t('facility.waste.currentCapacity')} value={figures.capacity.toFixed(0)}/>}
    {figures.loss && <BlockedReason reason={lossReason(figures.loss, figures.powerRatio)} />}
    <DrawerPanel.LabelValue label={t('facility.waste.processed')} value={`${figures.processed.toFixed(0)} · ${t('facility.served')}: ${served}`}/>
  </>;
}
