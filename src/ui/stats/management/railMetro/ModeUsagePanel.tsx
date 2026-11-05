import { t } from '../../../../i18n/t.ts';
import { Icon } from '../../../common/Icon';
import { LabeledList } from '../../../common/LabeledList.tsx';
import { MODE_ICON, MODE_LABEL } from '../transit/lineModels.ts';
import { LineUsageTable } from './LineUsageTable.tsx';
import type { ModeUsage } from './modeUsage.ts';
import { StationUsageTable } from './StationUsageTable.tsx';

export function ModeUsagePanel({ usage }: { usage: ModeUsage }) {
  const { mode } = usage;
  return <div className="rail-metro-mode" data-mode={mode}>
    <h4><Icon name={MODE_ICON[mode]} /> {t(MODE_LABEL[mode])}</h4>
    <p>{t(`railMetro.${mode}.help`)}</p>
    <LabeledList>
      <LabeledList.Row label={t(`railMetro.${mode}.stations`)}>{usage.stations.length}</LabeledList.Row>
      <LabeledList.Row label={t(`railMetro.${mode}.track`)}>{usage.trackTiles}</LabeledList.Row>
      <LabeledList.Row label={t('railMetro.activeLines')}>{usage.lines.filter(({ line }) => line.active).length} / {usage.lines.length}</LabeledList.Row>
      <LabeledList.Row label={t('transit.vehicles')}>{usage.vehicles}</LabeledList.Row>
      <LabeledList.Row label={t('eco.riders')}>{usage.riders.toFixed(1)} / {usage.capacity.toFixed(1)}</LabeledList.Row>
      <LabeledList.Row label={t('eco.cost')}>{usage.costPerHour.toFixed(1)}</LabeledList.Row>
      {mode === 'rail' && <LabeledList.Row label={t('transit.coal')}>{usage.coalPerHour.toFixed(2)}</LabeledList.Row>}
    </LabeledList>
    {usage.advice.map(key => <p key={key} role="note"><Icon name="warning" /> {t(key)}</p>)}
    <LineUsageTable lines={usage.lines} />
    <StationUsageTable stations={usage.stations} />
  </div>;
}
