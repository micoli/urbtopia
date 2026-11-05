import type { CoolingElement } from '../../core';
import { t } from '../../i18n/t';

interface ClimateCoolingTableProps {
  elements: readonly CoolingElement[];
}

export function ClimateCoolingTable({ elements }: ClimateCoolingTableProps) {
  if (elements.length === 0) return <p>{t('codex.climate.noCooling')}</p>;
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('eco.col.element')}</th>
            <th scope="col">{t('eco.col.count')}</th>
            <th scope="col">{t('eco.col.radius')}</th>
            <th scope="col">{t('eco.col.coolingWeight')}</th>
            <th scope="col">{t('eco.col.share')}</th>
          </tr>
        </thead>
        <tbody>
          {elements.map(({ type, count, radius, weight, share }) => (
            <tr key={type}>
              <th scope="row">{t(`building.${type}`)}</th>
              <td>{count}</td>
              <td>{radius}</td>
              <td>{weight.toFixed(1)}</td>
              <td>{Math.round(share * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
