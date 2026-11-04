import { t } from '../../i18n/t';
import { Note } from '../common/Note';

export function AdvisorAnswer({ answer, asking }: { answer: string; asking: boolean }) {
  if (answer === '') return <Note tone="muted">{asking ? t('advisor.thinking') : t('advisor.empty')}</Note>;
  return <p className="advisor-answer" aria-live="polite">{answer}</p>;
}
