import type { Language } from '../i18n/prefsStore';
import type { Cause } from '../core';
import { messageIn } from './messageIn';
import type { AdvisorMessage } from './AdvisorEngine';
import { summaryToText, type AdvisorSummary } from './buildAdvisorSummary';
import { DEFAULT_CONTEXT_LEVEL, type ContextLevel } from './contextLevel';
import type { RulesContext } from './loadRulesPassages';

const NO_RULES: RulesContext = { passages: [], aboutCity: true };
const RULES_QUESTION_LEVEL: ContextLevel = 2;

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
// A question about the rules gives the room of the city figures to the rules passages found for it.
export function buildAdvisorRequest(question: string, summary: AdvisorSummary, language: Language, level: ContextLevel = DEFAULT_CONTEXT_LEVEL, rules: RulesContext = NO_RULES): AdvisorMessage[] {
  const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
  const hasRules = rules.passages.length > 0;
  const summaryLevel = hasRules && !rules.aboutCity ? (Math.min(level, RULES_QUESTION_LEVEL) as ContextLevel) : level;
  const rulesText = hasRules ? `${messageIn(language, 'advisor.rules.title')}:\n${rules.passages.map(({ title, text }) => `${title}\n${text}`).join('\n\n')}\n\n` : '';
  return [
    { role: 'system', content: messageIn(language, 'advisor.system') },
    { role: 'user', content: `${summaryToText(summary, language, summaryLevel)}\n\n${rulesText}${messageIn(language, 'advisor.summary.question')}: ${trimmed}` },
  ];
}
