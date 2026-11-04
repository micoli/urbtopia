import { useState } from 'react';
import { advisorContextPreview } from '../advisor/advisorContextPreview';
import { prefsStore } from '../i18n/prefsStore';
import { gameStore } from '../store/gameStore';
import { ActionButton } from '../ui/common/ActionButton';
import { DevToolsSection } from './DevToolsSection';

export function AdvisorContextSection() {
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const show = () => setPreview(advisorContextPreview(gameStore.getState().state, prefsStore.getState().language, question.trim() || undefined));
  return (
    <DevToolsSection id="advisor" title="Conseiller" icon="settings">
      <label htmlFor="devtools-advisor-question">Question (vide : « que faire en premier »)</label>
      <input id="devtools-advisor-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} />
      <ActionButton onClick={show}>Voir le contexte envoyé à l’IA</ActionButton>
      {preview !== null && <pre className="devtools-advisor-context">{preview}</pre>}
    </DevToolsSection>
  );
}
