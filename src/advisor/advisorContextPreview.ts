import type { GameState } from '../core';
import type { Language } from '../i18n/prefsStore';
import { advisorCauses } from './advisorCauses';
import { buildAdvisorRequest, guidedQuestionText } from './advisorRequest';
import { buildAdvisorSummary } from './buildAdvisorSummary';

// Exactly the messages the engine would receive for this question, as text.
export function advisorContextPreview(state: GameState, language: Language, question = guidedQuestionText('first', language)): string {
  const messages = buildAdvisorRequest(question, buildAdvisorSummary(state, advisorCauses(state)), language);
  return messages.map(({ role, content }) => `[${role}]\n${content}`).join('\n\n');
}
