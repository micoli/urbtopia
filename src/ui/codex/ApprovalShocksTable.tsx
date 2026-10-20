import { POLITICS } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const signed = (points: number): string => `${points > 0 ? '+' : ''}${points}`;

export function ApprovalShocksTable() {
  const shocks = Object.entries(POLITICS.approval.shocks) as [keyof typeof POLITICS.approval.shocks, number][];
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.politics.shock.event')}</th>
            <th scope="col">{t('codex.politics.shock.points')}</th>
          </tr>
        </thead>
        <tbody>
          {shocks.map(([event, points]) => (
            <tr key={event}>
              <th scope="row">{t(`codex.politics.shock.${event}` as MessageKey)}</th>
              <td>{signed(points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
