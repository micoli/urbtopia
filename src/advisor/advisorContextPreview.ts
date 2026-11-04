import type { GameState } from '../core';
import type { Language } from '../i18n/prefsStore';
import { advisorCauses } from './advisorCauses';
import { buildAdvisorRequest, guidedQuestionText } from './advisorRequest';
import { buildAdvisorSummary } from './buildAdvisorSummary';
import type { ContextLevel } from './contextLevel';

// Exactly the messages the engine would receive for this question, as text.
export function advisorContextPreview(state: GameState, language: Language, level: ContextLevel, question = guidedQuestionText('first', language)): string {
  const messages = buildAdvisorRequest(question, buildAdvisorSummary(state, advisorCauses(state)), language, level);
  return messages.map(({ role, content }) => `[${role}]\n${content}`).join('\n\n');
}
