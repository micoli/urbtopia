import type { TransitReachFacilityFigures } from '../../core';
import { t } from '../../i18n/t';

export function TransitReachFacilityTable({ facilities }: { facilities: readonly TransitReachFacilityFigures[] }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.transitReach.facility')}</th>
            <th scope="col">{t('codex.transitReach.homes')}</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map(facility => (
            <tr key={facility.id}>
              <th scope="row">{t(`building.${facility.type}`)} #{facility.id}</th>
              <td>{facility.homes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
