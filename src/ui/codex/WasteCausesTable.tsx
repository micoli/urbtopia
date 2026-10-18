import type { WasteCause } from '../../core';
import { t } from '../../i18n/t';

export function WasteCausesTable({ causes }: { causes: Readonly<Record<WasteCause, number>> }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.waste.cause')}</th>
            <th scope="col">{t('codex.waste.homes')}</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(causes) as WasteCause[]).map(cause => (
            <tr key={cause}>
              <th scope="row">{t(`home.reason.${cause}`)}</th>
              <td>{causes[cause]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
