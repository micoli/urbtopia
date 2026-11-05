import type { HeatContribution, HeatSource } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const LABELS: Record<HeatSource, MessageKey> = {
  activity: 'eco.heat.activity', coal: 'eco.heat.coal', backup: 'eco.heat.backup', transport: 'eco.heat.transport',
};

interface ClimateHeatTableProps {
  sources: readonly HeatContribution[];
}

export function ClimateHeatTable({ sources }: ClimateHeatTableProps) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('eco.col.source')}</th>
            <th scope="col">{t('eco.col.impact')}</th>
            <th scope="col">{t('eco.col.warming')}</th>
            <th scope="col">{t('eco.col.share')}</th>
          </tr>
        </thead>
        <tbody>
          {[...sources].sort((a, b) => b.degrees - a.degrees).map(({ source, impact, degrees, share }) => (
            <tr key={source}>
              <th scope="row">{t(LABELS[source])}</th>
              <td>{impact.toFixed(1)}</td>
              <td>+{degrees.toFixed(2)} °C</td>
              <td>{Math.round(share * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
