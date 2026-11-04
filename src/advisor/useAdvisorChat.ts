import { useCallback, useEffect, useRef, useState } from 'react';
import { prefsStore } from '../i18n/prefsStore';
import { gameStore } from '../store/gameStore';
import type { AdvisorErrorKind } from './AdvisorEngine';
import { advisorCauses } from './advisorCauses';
import { buildAdvisorRequest } from './advisorRequest';
import { buildAdvisorSummary } from './buildAdvisorSummary';
import { classifyAdvisorFailure } from './classifyAdvisorFailure';
import { advisorEngine } from './currentAdvisorEngine';
import { questionHistoryStore } from './questionHistoryStore';

// The answer lives in this component only: it is never saved, exported or shared.
export function useAdvisorChat() {
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<AdvisorErrorKind | null>(null);
  const current = useRef<AbortController | null>(null);

  const stop = useCallback(() => current.current?.abort(), []);

  const ask = useCallback(async (question: string) => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    questionHistoryStore.getState().record(question);
    const state = gameStore.getState().state;
    const summary = buildAdvisorSummary(state, advisorCauses(state));
    const messages = buildAdvisorRequest(question, summary, prefsStore.getState().language, prefsStore.getState().advisorContextLevel);
    setAnswer('');
    setError(null);
    setAsking(true);
    try {
      for await (const chunk of advisorEngine().ask(messages, controller.signal)) setAnswer((text) => text + chunk);
    } catch (failure) {
      if (!controller.signal.aborted) setError(classifyAdvisorFailure(failure).kind);
    } finally {
      if (current.current === controller) setAsking(false);
    }
  }, []);

  useEffect(() => () => current.current?.abort(), []);

  return { answer, asking, error, ask, stop };
}
