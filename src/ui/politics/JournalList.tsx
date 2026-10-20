import { type JournalEntry, type PetitionCause } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { SectionHeading } from '../common/SectionHeading';
import { causeLabel } from './causeLabel';


function subjectLabel(entry: JournalEntry): string {
  if (entry.subject === undefined) return '';
  if (entry.type === 'objectiveCompleted') return t(`objective.${entry.subject}.name` as MessageKey);
  if (entry.type === 'ordinanceLapsed') return t(`ordinance.${entry.subject}.name` as MessageKey);
  return causeLabel(entry.subject as PetitionCause);
}

export function JournalList({ journal }: { journal: readonly JournalEntry[] }) {
  const recent = [...journal].reverse().slice(0, 8);
  return (
    <section aria-label={t('politics.journal')}>
      <SectionHeading>{t('politics.journal')}</SectionHeading>
      {recent.length === 0 && <p>{t('politics.journal.empty')}</p>}
      <ul className="politics-journal">
        {recent.map((entry, index) => <li key={`${entry.day}-${entry.type}-${index}`} data-type={entry.type}>{t(`politics.journal.${entry.type}`).replace('{subject}', subjectLabel(entry))}</li>)}
      </ul>
    </section>
  );
}

