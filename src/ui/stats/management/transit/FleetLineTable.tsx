import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { formatHeadway } from './formatHeadway.ts';
import { MODE_LABEL } from './lineModels.ts';
import { lineStatusKey } from './lineStatusKey.ts';

export function FleetLineTable({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const lines = transport.lines.filter(line => line.mode !== 'bus');
  if (!lines.length) return null;
  return <table className="transit-table">
    <thead>
      <tr>
        <th>{t('transit.line')}</th>
        <th>{t('transit.vehicles')}</th>
        <th>{t('transit.targetHeadway')}</th>
        <th>{t('transit.headway')}</th>
        <th>{t('transit.status')}</th>
      </tr>
    </thead>
    <tbody>
      {lines.map(line => <tr key={line.id}>
        <td data-label={t('transit.line')}>{t(MODE_LABEL[line.mode])} #{line.id}</td>
        <td data-label={t('transit.vehicles')}>{line.vehicleCount}</td>
        <td data-label={t('transit.targetHeadway')}>{formatHeadway(line.targetHeadway)}</td>
        <td data-label={t('transit.headway')}>{formatHeadway(line.headway)}</td>
        <td data-label={t('transit.status')}>{t(lineStatusKey(line.status))}</td>
      </tr>)}
    </tbody>
  </table>;
}
