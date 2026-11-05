import { t } from '../../../../i18n/t.ts';
import { formatHeadway } from '../transit/formatHeadway.ts';
import { lineStatusKey } from '../transit/lineStatusKey.ts';
import type { LineUsage } from './modeUsage.ts';

export function LineUsageTable({ lines }: { lines: LineUsage[] }) {
  if (!lines.length) return null;
  return <table className="transit-table">
    <thead>
      <tr>
        <th>{t('transit.line')}</th>
        <th>{t('transit.status')}</th>
        <th>{t('eco.riders')}</th>
        <th>{t('railMetro.load')}</th>
        <th>{t('transit.vehicles')}</th>
        <th>{t('transit.headway')}</th>
      </tr>
    </thead>
    <tbody>
      {lines.map(({ line, load, level }) => <tr key={line.id} data-level={level}>
        <td data-label={t('transit.line')}>#{line.id} · {line.stops.length} {t('railMetro.stops')}</td>
        <td data-label={t('transit.status')}>{t(lineStatusKey(line.status))}</td>
        <td data-label={t('eco.riders')}>{line.riders.toFixed(1)} / {line.capacity.toFixed(1)}</td>
        <td data-label={t('railMetro.load')}>{(load * 100).toFixed(0)}%</td>
        <td data-label={t('transit.vehicles')}>{line.vehicleCount}</td>
        <td data-label={t('transit.headway')}>{formatHeadway(line.headway)}</td>
      </tr>)}
    </tbody>
  </table>;
}
