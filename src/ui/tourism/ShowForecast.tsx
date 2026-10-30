import { gatheringCapacityOf, type Building } from '../../core';
import type { GatheringPreview } from '../../core/tourism/gatherings';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { ProgressBar } from '../common/ProgressBar';
import { UrbsAmount } from '../common/UrbsAmount';

interface ShowForecastProps {
  building: Building;
  preview: GatheringPreview;
}

export function ShowForecast({ building, preview }: ShowForecastProps) {
  const capacity = gatheringCapacityOf(building);
  const net = preview.revenue - preview.cost;
  return (
    <div className="show-forecast">
      <div className="takings-meter-head">
        <span>{t('show.crowd')}</span>
        <span>{Math.round(preview.crowd)} / {capacity}</span>
      </div>
      <ProgressBar value={preview.crowd} max={capacity} label={t('show.crowd')} />
      <p className="tourism-help">{t('show.crowdSplit').replace('{tourists}', `${Math.round(preview.tourists)}`).replace('{citizens}', `${Math.round(preview.citizens)}`)}</p>
      <DrawerPanel.LabelValue label={t('show.revenue')} value={<UrbsAmount value={preview.revenue} />} />
      <DrawerPanel.LabelValue label={t('show.cost')} value={<UrbsAmount value={preview.cost} />} />
      <p className="show-net" data-net={net >= 0 ? 'gain' : 'loss'}>
        <span>{t('show.net')}</span>
        <strong>{net >= 0 ? '+' : '−'}<UrbsAmount value={Math.abs(net)} /></strong>
      </p>
      {net < 0 ? <p className="note note--warn">{t('show.loss')}</p> : null}
    </div>
  );
}
