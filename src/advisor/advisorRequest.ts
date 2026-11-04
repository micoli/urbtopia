import type { Language } from '../i18n/prefsStore';
import type { Cause } from '../core';
import { messageIn } from './messageIn';
import type { AdvisorMessage } from './AdvisorEngine';
import { summaryToText, type AdvisorSummary } from './buildAdvisorSummary';

export const MAX_QUESTION_LENGTH = 300;

export type GuidedQuestionId = 'congestion' | 'waste' | 'first';

export const GUIDED_QUESTIONS: readonly GuidedQuestionId[] = ['congestion', 'waste', 'first'];

export function guidedQuestionText(id: GuidedQuestionId, language: Language): string {
  return messageIn(language, `advisor.question.${id}`);
}

export function explainCauseQuestion(cause: Cause, language: Language): string {
  return messageIn(language, 'advisor.question.explain', { cause: messageIn(language, cause.key as never, cause.params) });
}

// The question goes in the user message, after the figures: it can never alter the system prompt.
export function buildAdvisorRequest(question: string, summary: AdvisorSummary, language: Language): AdvisorMessage[] {
  const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
  return [
    { role: 'system', content: messageIn(language, 'advisor.system') },
    { role: 'user', content: `${summaryToText(summary, language)}\n\n${messageIn(language, 'advisor.summary.question')}: ${trimmed}` },
  ];
}
