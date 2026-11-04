import { useEffect } from 'react';
import { useStore } from 'zustand';
import { advisorStore } from '../../advisor/advisorStore';
import { useAdvisorChat } from '../../advisor/useAdvisorChat';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { Note } from '../common/Note';
import { ProgressBar } from '../common/ProgressBar';
import { advisorErrorKey } from './advisorErrorKey';
import { AdvisorAnswer } from './AdvisorAnswer';
import { AdvisorContextLevel } from './AdvisorContextLevel';
import { AdvisorHistory } from './AdvisorHistory';
import { AdvisorQuestions } from './AdvisorQuestions';
import { useAdvisor } from './useAdvisor';

export function AdvisorDialog() {
  const language = useStore(prefsStore, (store) => store.language);
  const phase = useAdvisor((store) => store.phase);
  const progress = useAdvisor((store) => store.progress);
  const loadError = useAdvisor((store) => store.error);
  const pendingQuestion = useAdvisor((store) => store.pendingQuestion);
  const { answer, asking, error, ask, stop } = useAdvisorChat();
  const ready = phase === 'ready';

  useEffect(() => {
    void advisorStore.getState().ensureLoaded();
  }, []);

  useEffect(() => {
    if (!ready || pendingQuestion === null) return;
    const question = advisorStore.getState().takePendingQuestion();
    if (question) void ask(question);
  }, [ready, pendingQuestion, ask]);

  const failure = loadError ?? error;
  return (
    <Dialog className="advisor-dialog">
      <Dialog.Title>{t('advisor.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="advisor-body">
          {!ready && !failure && <ProgressBar value={progress} max={1} label={t('advisor.loading')} />}
          {!ready && !failure && <p>{t('advisor.loading')}</p>}
          {failure && <Note>{t(advisorErrorKey(failure))}</Note>}
          <AdvisorQuestions language={language} disabled={!ready || asking} onAsk={(question) => void ask(question)} />
          <AdvisorHistory disabled={!ready || asking} onAsk={(question) => void ask(question)} />
          <AdvisorContextLevel />
          <AdvisorAnswer answer={answer} asking={asking} />
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        {asking && <ActionButton onClick={stop}>{t('advisor.stop')}</ActionButton>}
        <ActionButton variant="primary" onClick={() => advisorStore.getState().closeWindow()}>{t('advisor.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
