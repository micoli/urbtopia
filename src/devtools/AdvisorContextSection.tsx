import { useState } from 'react';
import { useStore } from 'zustand';
import { advisorContextPreview } from '../advisor/advisorContextPreview';
import { guidedQuestionText } from '../advisor/advisorRequest';
import { advisorStore } from '../advisor/advisorStore';
import { useAdvisorChat } from '../advisor/useAdvisorChat';
import { prefsStore } from '../i18n/prefsStore';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { ActionButton } from '../ui/common/ActionButton';
import { advisorErrorKey } from '../ui/advisor/advisorErrorKey';
import { AdvisorContextLevel } from '../ui/advisor/AdvisorContextLevel';
import { DevToolsSection } from './DevToolsSection';

export function AdvisorContextSection() {
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const enabled = useStore(prefsStore, (store) => store.advisor);
  const { answer, asking, error, ask, stop } = useAdvisorChat();
  const text = question.trim() || undefined;

  const show = () => {
    const { language, advisorContextLevel } = prefsStore.getState();
    setPreview(advisorContextPreview(gameStore.getState().state, language, advisorContextLevel, text));
  };

  const send = async () => {
    await advisorStore.getState().ensureLoaded();
    if (advisorStore.getState().phase !== 'ready') return;
    const { language } = prefsStore.getState();
    await ask(text ?? guidedQuestionText('first', language));
  };

  return (
    <DevToolsSection id="advisor" title="Conseiller" icon="settings">
      <AdvisorContextLevel />
      <label htmlFor="devtools-advisor-question">Question (vide : « que faire en premier »)</label>
      <input id="devtools-advisor-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} />
      <ActionButton onClick={show}>Voir le contexte envoyé à l’IA</ActionButton>
      {preview !== null && <pre className="devtools-advisor-context">{preview}</pre>}
      <ActionButton variant="primary" disabled={!enabled || asking} onClick={() => void send()}>Poser la question et voir la réponse</ActionButton>
      {!enabled && <small>Activez le Conseiller dans les réglages pour interroger le modèle.</small>}
      {asking && <ActionButton onClick={stop}>Arrêter</ActionButton>}
      {error && <p role="alert">{t(advisorErrorKey(error))}</p>}
      {(answer !== '' || asking) && <pre className="devtools-advisor-context" aria-live="polite">{answer === '' ? '…' : answer}</pre>}
    </DevToolsSection>
  );
}
