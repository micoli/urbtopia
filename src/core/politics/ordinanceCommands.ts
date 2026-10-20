import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';
import { councilForecast, proposalIssue, type ProposalIssue } from './council';
import { ORDINANCE_ENTRIES, ordinanceById, type OrdinanceId } from './ordinances';
import { politicsDayOf, withApprovalShock } from './politics';
import { POLITICS } from './politicsBalance';

const ISSUE_KEYS = {
  inactive: 'error.politicsInactive',
  locked: 'error.ordinanceLocked',
  adopted: 'error.ordinanceAdopted',
  excluded: 'error.ordinanceExcluded',
  waiting: 'error.ordinanceWaiting',
} as const satisfies Record<ProposalIssue, string>;

const isKnown = (id: string): id is OrdinanceId => ORDINANCE_ENTRIES.some(entry => entry.id === id);

export function proposeOrdinance(state: GameState, id: string): CommandOutcome {
  if (!isKnown(id)) return { key: 'error.unknownOrdinance' };
  const issue = proposalIssue(state, id);
  if (issue) return { key: ISSUE_KEYS[issue] };
  const politics = state.politics!;
  if (!councilForecast(state, id).passes) {
    const retryDay = { ...politics.retryDay, [id]: politicsDayOf(state) + POLITICS.council.reproposeDelayDays };
    return { state: { ...state, politics: { ...politics, retryDay } }, events: [{ type: 'OrdinanceRejected', id }] };
  }
  const adopted = withApprovalShock({ ...state, politics: { ...politics, adopted: [...politics.adopted, id] } }, POLITICS.approval.shocks.ordinanceAdopted);
  return { state: adopted, events: [{ type: 'OrdinanceAdopted', id }] };
}

export function repealOrdinance(state: GameState, id: string): CommandOutcome {
  if (!isKnown(id) || !state.politics?.adopted.includes(id)) return { key: 'error.unknownOrdinance' };
  const repealed = { ...state, politics: { ...state.politics, adopted: state.politics.adopted.filter(other => other !== id) } };
  if (!ordinanceById(id).popular) return { state: repealed, events: [{ type: 'OrdinanceRepealed', id }] };
  return { state: withApprovalShock(repealed, POLITICS.approval.shocks.popularOrdinanceRepealed), events: [{ type: 'OrdinanceRepealed', id }] };
}
