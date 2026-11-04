import { useStore } from 'zustand';
import { GUIDED_QUESTIONS, guidedQuestionText } from '../../advisor/advisorRequest';
import { prefsStore, type Language } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { AccordionSection } from '../common/AccordionSection';
import { ActionButton } from '../common/ActionButton';

interface AdvisorSuggestionsProps {
  language: Language;
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function AdvisorSuggestions({ language, disabled, onAsk }: AdvisorSuggestionsProps) {
  const expanded = useStore(prefsStore, (store) => store.advisorSuggestionsOpen);
  return (
    <AccordionSection id="advisor-suggestions" title={t('advisor.suggestions.title')} chevron expanded={expanded} onToggle={() => prefsStore.getState().setAdvisorSuggestionsOpen(!expanded)} toggleClassName="advisor-toggle" contentClassName="advisor-guided">
      {GUIDED_QUESTIONS.map((id) => (
        <ActionButton key={id} size="sm" disabled={disabled} onClick={() => onAsk(guidedQuestionText(id, language))}>
          {guidedQuestionText(id, language)}
        </ActionButton>
      ))}
    </AccordionSection>
  );
}
