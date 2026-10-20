import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';

export function claimGrants(state: GameState): CommandOutcome {
  const due = Math.floor(state.politics?.grantsDue ?? 0);
  if (!state.politics || due < 1) return { key: 'error.noGrants' };
  return { state: { ...state, urbs: state.urbs + due, politics: { ...state.politics, grantsDue: state.politics.grantsDue - due } }, events: [{ type: 'GrantsClaimed', amount: due }] };
}
