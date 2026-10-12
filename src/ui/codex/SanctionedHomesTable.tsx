import { taxLostPerHour, type SanctionedHome } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const MAX_ROWS = 10;

export function SanctionedHomesTable({ homes }: { homes: readonly SanctionedHome[] }) {
  const worst = [...homes].sort((a, b) => taxLostPerHour(b) - taxLostPerHour(a)).slice(0, MAX_ROWS);
  return (
    <>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.sanctions.home')}</th>
              <th scope="col">{t('codex.sanctions.cause')}</th>
              <th scope="col">{t('codex.sanctions.satisfaction')}</th>
              <th scope="col">{t('codex.sanctions.lost')}</th>
            </tr>
          </thead>
          <tbody>
            {worst.map(entry => (
              <tr key={entry.home.id}>
                <th scope="row">{t('home.tier')} {entry.home.tier} ({entry.home.x}, {entry.home.y})</th>
                <td>{t(`needs.factor.${entry.sanction.factor}` as MessageKey)}</td>
                <td>{Math.round(entry.sanction.satisfaction)}%</td>
                <td>{taxLostPerHour(entry).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {homes.length > worst.length && <p>{t('codex.sanctions.more').replace('{count}', String(homes.length - worst.length))}</p>}
    </>
  );
}
