import { serviceFurnitureQuality, type Building } from '../../core';
import { t } from '../../i18n/t';
import { formatPercent } from './formatPercent';
import { UrbsStat } from '../common/UrbsStat';

interface ServiceStatsProps {
  building: Building;
}

// What sits at the top of the main menu of a Service interior: the Urbs and the quality its furniture adds, before the Staff deliver it.
export function ServiceStats({ building }: ServiceStatsProps) {
  const quality = serviceFurnitureQuality(building);
  return (
    <>
      <UrbsStat />
      <div className="dock-stat" title={t('service.interior.quality')}>
        <span className="dock-stat-value">{formatPercent(quality)}</span>
        <span className="dock-stat-label">{t('service.interior.quality')}</span>
      </div>
    </>
  );
}
