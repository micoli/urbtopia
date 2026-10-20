import { OBJECTIVE_ENTRIES, OBJECTIVE_METRICS_AT_MOST } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { formatObjectiveValue } from '../politics/formatObjectiveValue';

export function ObjectiveRulesTable() {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.politics.objective')}</th>
            <th scope="col">{t('codex.politics.objective.measure')}</th>
            <th scope="col">{t('codex.politics.objective.target')}</th>
            <th scope="col">{t('codex.politics.objective.days')}</th>
            <th scope="col">{t('codex.politics.objective.grant')}</th>
            <th scope="col">{t('codex.politics.ordinance.unlock')}</th>
          </tr>
        </thead>
        <tbody>
          {OBJECTIVE_ENTRIES.map(entry => (
            <tr key={entry.id}>
              <th scope="row">{t(`objective.${entry.id}.name` as MessageKey)}</th>
              <td>{t(`objective.metric.${entry.metric}` as MessageKey)}</td>
              <td>{t(OBJECTIVE_METRICS_AT_MOST.includes(entry.metric) ? 'codex.politics.objective.atMost' : 'codex.politics.objective.atLeast')} {formatObjectiveValue(entry.metric, entry.target)}</td>
              <td>{entry.holdDays}</td>
              <td>{entry.grant}</td>
              <td>{entry.unlockCitizens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
