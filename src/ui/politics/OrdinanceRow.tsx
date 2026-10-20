import { ORDINANCE_ENTRIES, councilForecast, ordinanceById, proposalIssue, politicsDayOf, type GameState, type OrdinanceId } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { CouncilCircle } from './CouncilCircle';
import { formatDays } from './formatDays';

function statusOf(state: GameState, id: OrdinanceId): string | null {
  const politics = state.politics!;
  const ordinance = ordinanceById(id);
  const issue = proposalIssue(state, id);
  if (issue === 'adopted') return t('politics.ordinance.adopted');
  if (issue === 'locked') return t('politics.ordinance.locked').replace('{citizens}', String(ordinance.unlockCitizens));
  if (issue === 'waiting') return t('politics.ordinance.waiting').replace('{duration}', formatDays((politics.retryDay[id] ?? 0) - politicsDayOf(state)));
  if (issue === 'excluded') {
    const blocking = ORDINANCE_ENTRIES.find(other => other.exclusiveGroup === ordinance.exclusiveGroup && politics.adopted.includes(other.id))!;
    return t('politics.ordinance.excluded').replace('{name}', t(`ordinance.${blocking.id}.name` as MessageKey));
  }
  return null;
}

export function OrdinanceRow({ state, id }: { state: GameState; id: OrdinanceId }) {
  const politics = state.politics!;
  const ordinance = ordinanceById(id);
  const adopted = politics.adopted.includes(id);
  const status = statusOf(state, id);
  const proposable = proposalIssue(state, id) === null;
  const forecast = councilForecast(state, id);
  const upkeep = ordinance.upkeepPerDay > 0 ? t('politics.ordinance.upkeep').replace('{amount}', String(ordinance.upkeepPerDay)) : t('politics.ordinance.noUpkeep');
  return (
    <li className="politics-row" data-adopted={adopted} data-locked={proposalIssue(state, id) === 'locked'}>
      <div className="politics-row-text">
        <strong>{t(`ordinance.${id}.name` as MessageKey)}</strong>
        <p>{t(`ordinance.${id}.description` as MessageKey)}</p>
        <small>{upkeep}{ordinance.popular ? ` · ${t('politics.ordinance.popular')}` : ''}</small>
        {status && <small className="politics-row-status">{status}</small>}
        {proposable && <small>{t('politics.ordinance.forecast').replace('{seatsFor}', String(forecast.seatsFor)).replace('{seats}', String(forecast.seats))} — {forecast.passes ? t('politics.ordinance.passes') : t('politics.ordinance.fails')}</small>}
      </div>
      {proposable && <CouncilCircle seats={politics.seats} votes={forecast.votes} size={56} />}
      {adopted && <ActionButton onClick={() => gameStore.getState().send({ type: 'RepealOrdinance', id })}>{t('politics.repeal')}</ActionButton>}
      {proposable && <ActionButton variant="primary" onClick={() => gameStore.getState().send({ type: 'ProposeOrdinance', id })}>{t('politics.propose')}</ActionButton>}
    </li>
  );
}
