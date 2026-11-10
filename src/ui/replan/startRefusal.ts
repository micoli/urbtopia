import type { MessageKey } from '../../i18n/messages';
import type { GameState } from '../../core';

// Why a Replan cannot start now, null when it can. The Save conflict is the screen's to know, the rest is the City's.
export function startRefusal(state: GameState, saveConflict: boolean): MessageKey | null {
  if (state.replan) return null;
  if (state.challenge) return 'replan.blocked.challenge';
  if (state.tutorial !== null) return 'replan.blocked.tutorial';
  if (saveConflict) return 'replan.blocked.conflict';
  return null;
}
