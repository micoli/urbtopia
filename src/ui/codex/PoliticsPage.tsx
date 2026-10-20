import { FACTION_IDS, POLITICS, approvalOf, difficultyOf, isPoliticsActive, termDaysLeft, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ApprovalShocksTable } from './ApprovalShocksTable';
import { ObjectiveRulesTable } from './ObjectiveRulesTable';
import { OrdinanceRulesTable } from './OrdinanceRulesTable';
import { PoliticsDifficultyTable } from './PoliticsDifficultyTable';
import { formatDays } from '../politics/formatDays';

const PERCENT = 100;

const percent = (share: number): string => String(Math.round(share * PERCENT));

const MOST_SEATS_MOVED = 2;

export function PoliticsPage() {
  const state = useGame(store => store.state);
  const difficulty = difficultyOf(state);
  const seats = FACTION_IDS.reduce((sum, faction) => sum + POLITICS.council.seats[faction], 0);
  const { petitions, approval, objectives, term } = POLITICS;
  const politics = state.politics;
  const current = approvalOf(state);
  const { low, high } = { low: String(objectives.grantScale.atZeroApproval), high: String(objectives.grantScale.atFullApproval) };
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.politics.title')}</h3>
      <p>{t('codex.politics.intro')}</p>
      <p>{t('codex.politics.activation').replace('{duration}', formatDays(POLITICS.adaptationDays))}</p>
      <h4>{t('codex.politics.byDifficulty')}</h4>
      <PoliticsDifficultyTable current={difficulty} />
      <h4>{t('codex.politics.approval')}</h4>
      <p>{t('codex.politics.approval.text').replace('{share}', percent(approval.dailyConvergence)).replace('{fade}', percent(approval.shockFadePerDay))}</p>
      <ApprovalShocksTable />
      <h4>{t('codex.politics.council')}</h4>
      <p>{t('codex.politics.council.text').replace('{seats}', String(seats)).replace('{duration}', formatDays(POLITICS.council.reproposeDelayDays))}</p>
      <p>{t('codex.politics.council.goodwill')}</p>
      <h4>{t('codex.politics.ordinances')}</h4>
      <p>{t('codex.politics.ordinances.text')}</p>
      <OrdinanceRulesTable />
      <h4>{t('codex.politics.objectives')}</h4>
      <p>{t('codex.politics.objectives.text').replace('{count}', String(objectives.activeCount)).replace('{low}', low).replace('{high}', high)}</p>
      <ObjectiveRulesTable />
      <h4>{t('codex.politics.petitions')}</h4>
      <p>{t('codex.politics.petitions.text').replace('{chance}', percent(petitions.chancePerDay)).replace('{max}', String(petitions.maxOpen)).replace('{duration}', formatDays(petitions.escalationDays))}</p>
      <p>{t('codex.politics.support.text').replace('{above}', String(petitions.supportAbove)).replace('{duration}', formatDays(petitions.supportDays))}</p>
      <h4>{t('codex.politics.term')}</h4>
      <p>{t('codex.politics.term.text').replace('{duration}', formatDays(term.days)).replace('{moved}', String(MOST_SEATS_MOVED))}</p>
      <h4>{t('codex.politics.city')}</h4>
      <p><strong>{t('codex.sanctions.current').replace('{difficulty}', t(`difficulty.${difficulty}`))}</strong></p>
      {difficulty === 'cozy' && <p>{t('codex.politics.city.cozy')}</p>}
      {difficulty !== 'cozy' && !isPoliticsActive(state) && <p>{t('codex.politics.city.noTownHall')}</p>}
      {politics && current !== null && (
        <p>
          {t('townHall.approval').replace('{approval}', String(Math.round(current)))}
          {' · '}{t('politics.term').replace('{number}', String(politics.term.number))}: {t('politics.termLeft').replace('{duration}', formatDays(termDaysLeft(politics, politics.day)))}
          {' · '}{totalCitizens(state)} {t('codex.politics.ordinance.unlock')}
        </p>
      )}
    </>
  );
}
