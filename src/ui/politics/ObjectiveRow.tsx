import { OBJECTIVE_METRICS_AT_MOST, grantOf, objectiveById, objectiveValue, type ActiveObjective, type GameState } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { formatObjectiveValue } from './formatObjectiveValue';

export function ObjectiveRow({ state, active }: { state: GameState; active: ActiveObjective }) {
  const objective = objectiveById(active.id);
  const atMost = OBJECTIVE_METRICS_AT_MOST.includes(objective.metric);
  const now = formatObjectiveValue(objective.metric, objectiveValue(state, objective.metric));
  const target = `${t(atMost ? 'politics.objective.atMost' : 'politics.objective.atLeast')} ${formatObjectiveValue(objective.metric, objective.target)}`;
  return (
    <li className="politics-row">
      <div className="politics-row-text">
        <strong>{t(`objective.${active.id}.name` as MessageKey)}</strong>
        <p>{t(`objective.${active.id}.description` as MessageKey)}</p>
        <small>{t(`objective.metric.${objective.metric}` as MessageKey)}: {t('politics.objective.now').replace('{value}', now).replace('{target}', target)}</small>
        <small>{t('politics.objective.progress').replace('{held}', String(active.heldDays)).replace('{hold}', String(objective.holdDays))} · {t('politics.objective.grant').replace('{amount}', String(grantOf(state, active.id)))}</small>
        <progress max={objective.holdDays} value={active.heldDays} aria-label={t('politics.objective.progress').replace('{held}', String(active.heldDays)).replace('{hold}', String(objective.holdDays))} />
      </div>
    </li>
  );
}
