import { t } from '../../../../i18n/t.ts';
import { stopLabel } from '../transit/stopLabel.ts';
import type { StationUsage } from './modeUsage.ts';

export function StationUsageTable({ stations }: { stations: StationUsage[] }) {
  if (!stations.length) return null;
  return <table className="transit-table">
    <thead>
      <tr>
        <th>{t('railMetro.station')}</th>
        <th>{t('railMetro.linesServing')}</th>
        <th>{t('railMetro.boarded')}</th>
        <th>{t('railMetro.alighted')}</th>
      </tr>
    </thead>
    <tbody>
      {stations.map(({ building, lineIds, boarded, alighted }) => <tr key={building.id}>
        <td data-label={t('railMetro.station')}>{stopLabel(building, building.id)}</td>
        <td data-label={t('railMetro.linesServing')}>{lineIds.length ? lineIds.map(id => `#${id}`).join(', ') : t('railMetro.unserved')}</td>
        <td data-label={t('railMetro.boarded')}>{boarded.toFixed(1)}</td>
        <td data-label={t('railMetro.alighted')}>{alighted.toFixed(1)}</td>
      </tr>)}
    </tbody>
  </table>;
}
