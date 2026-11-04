import { useStore } from 'zustand';
import { questionHistoryStore } from '../../advisor/questionHistoryStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';

interface AdvisorHistoryProps {
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function AdvisorHistory({ disabled, onAsk }: AdvisorHistoryProps) {
  const questions = useStore(questionHistoryStore, (store) => store.questions);
  if (questions.length === 0) return null;
  return (
    <section className="advisor-history" aria-label={t('advisor.history.title')}>
      <h3>{t('advisor.history.title')}</h3>
      <ul>
        {questions.map((question) => (
          <li key={question}>
            <ActionButton size="xs" disabled={disabled} onClick={() => onAsk(question)}>{question}</ActionButton>
          </li>
        ))}
      </ul>
      <ActionButton size="xs" onClick={() => questionHistoryStore.getState().clear()}>{t('advisor.history.clear')}</ActionButton>
    </section>
  );
}
