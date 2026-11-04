import { t } from '../../i18n/t';
import { Note } from '../common/Note';
import { AdvisorThinking } from './AdvisorThinking';

export function AdvisorAnswer({ answer, asking }: { answer: string; asking: boolean }) {
  if (answer === '' && asking) return <AdvisorThinking />;
  if (answer === '') return <Note tone="muted">{t('advisor.empty')}</Note>;
  return <p className="advisor-answer" aria-live="polite">{answer}</p>;
}
