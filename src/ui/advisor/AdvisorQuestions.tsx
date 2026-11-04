import { useState } from 'react';
import { MAX_QUESTION_LENGTH } from '../../advisor/advisorRequest';
import type { Language } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { AdvisorSuggestions } from './AdvisorSuggestions';
import { TextField } from '../common/TextField';

interface AdvisorQuestionsProps {
  language: Language;
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function AdvisorQuestions({ language, disabled, onAsk }: AdvisorQuestionsProps) {
  const [free, setFree] = useState('');
  const submit = () => {
    if (disabled || free.trim() === '') return;
    onAsk(free);
    setFree('');
  };
  return (
    <div className="advisor-questions">
      <AdvisorSuggestions language={language} disabled={disabled} onAsk={onAsk} />
      <div className="advisor-free">
        <TextField label={t('advisor.free.label')} placeholder={t('advisor.free.placeholder')} value={free} maxLength={MAX_QUESTION_LENGTH} onChange={setFree} onSubmit={submit} />
        <ActionButton size="sm" disabled={disabled || free.trim() === ''} onClick={submit}>{t('advisor.send')}</ActionButton>
      </div>
    </div>
  );
}
