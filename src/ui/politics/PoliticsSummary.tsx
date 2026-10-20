import { ORDINANCE_ENTRIES, approvalOf, councilForecast, difficultyOf, isPoliticsAdaptingOn, politicsRuleOf, proposalIssue, termDaysLeft, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { Note } from '../common/Note';
import { SectionHeading } from '../common/SectionHeading';
import { formatDays } from './formatDays';
import { JournalList } from './JournalList';

const formatMandate = (mandate: number): string => `${mandate > 0 ? '+' : ''}${Math.round(mandate * 100)} %`;

export function PoliticsSummary({ state }: { state: GameState }) {
  const politics = state.politics;
  const approval = approvalOf(state);
  if (!politics || approval === null) return null;
  const rule = politicsRuleOf(difficultyOf(state));
  const passing = ORDINANCE_ENTRIES.filter(({ id }) => proposalIssue(state, id) === null && councilForecast(state, id).passes).length;
  const proposable = ORDINANCE_ENTRIES.filter(({ id }) => proposalIssue(state, id) === null).length;
  const demonstrations = politics.petitions.filter(petition => petition.escalated).length;
  const adaptingDays = Math.max(0, politics.adaptationUntilDay - politics.day);
  return (
    <section id="politics-summary" className="eco-wide">
      <SectionHeading>{t('politics.summary')}</SectionHeading>
      {isPoliticsAdaptingOn(politics, politics.day) && <Note tone="muted">{t('politics.adapting').replace('{duration}', formatDays(adaptingDays))}</Note>}
      <progress max={100} value={approval} aria-label={t('politics.approval')} />
      <LabeledList>
        <LabeledList.Row label={t('politics.approval')}>{Math.round(approval)}</LabeledList.Row>
        {rule.election
          ? <LabeledList.Row label={t('politics.term').replace('{number}', String(politics.term.number))}>{t('politics.termLeft').replace('{duration}', formatDays(termDaysLeft(politics, politics.day)))}</LabeledList.Row>
          : <LabeledList.Row label={t('politics.term').replace('{number}', String(politics.term.number))}>{t('politics.noElection')}</LabeledList.Row>}
        {rule.election && <LabeledList.Row label={t('politics.mandate')}>{formatMandate(politics.mandate)}</LabeledList.Row>}
        <LabeledList.Row label={t('politics.summary.ordinances')}>{politics.adopted.length}</LabeledList.Row>
        <LabeledList.Row label={t('politics.summary.passing')}>{`${passing} / ${proposable}`}</LabeledList.Row>
        <LabeledList.Row label={t('politics.summary.objectives')}>{politics.objectives.length}</LabeledList.Row>
        <LabeledList.Row label={t('politics.summary.petitions')}>{politics.petitions.length}</LabeledList.Row>
        {rule.demonstrations && <LabeledList.Row label={t('politics.summary.demonstrations')}>{demonstrations}</LabeledList.Row>}
        <LabeledList.Row label={t('politics.summary.grants')}>{Math.floor(politics.grantsDue)}</LabeledList.Row>
      </LabeledList>
      <JournalList journal={politics.journal} />
    </section>
  );
}
