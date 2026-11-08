import type { GameState } from '../core';
import type { Language } from '../i18n/prefsStore';
import { advisorCauses } from './advisorCauses';
import { buildAdvisorRequest, guidedQuestionText } from './advisorRequest';
import { buildAdvisorSummary } from './buildAdvisorSummary';
import type { ContextLevel } from './contextLevel';
import { rulesContextFor } from './loadRulesPassages';

// Exactly the messages the engine would receive for this question, as text.
export async function advisorContextPreview(state: GameState, language: Language, level: ContextLevel, question = guidedQuestionText('first', language)): Promise<string> {
  const rules = await rulesContextFor(question, language);
  const messages = buildAdvisorRequest(question, buildAdvisorSummary(state, advisorCauses(state)), language, level, rules);
  return messages.map(({ role, content }) => `[${role}]\n${content}`).join('\n\n');
}
