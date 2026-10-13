import { GOODS, MATERIALS, valueOf, type ItemId } from '../economy/items';
import type { ErrorKey } from '../engine/commands';
import type { GameState } from '../engine/state';
import { debitStorage, isValidLot } from '../trade/tradeLedger';
import type { TradeLine } from '../trade/types';
import { CHALLENGE_CLAIM_RETENTION_MS, CHALLENGE_REWARD_MULTIPLIER, type ChallengeClaim, type ChallengeProgress, type ChallengeRewardKind } from './types';

export type ChallengeResult = { state: GameState } | { error: ErrorKey };

export interface ChallengeStartInput {
  id: string;
  goal: readonly TradeLine[];
  deadline: number;
}

export function setAsideOf(progress: ChallengeProgress, item: string): number {
  return progress.stock[item] ?? 0;
}

export function remainingOf(progress: ChallengeProgress, item: string): number {
  const line = progress.goal.find((candidate) => candidate.item === item);
  return line ? line.quantity - setAsideOf(progress, item) : 0;
}

export function isChallengeStockComplete(progress: ChallengeProgress | undefined): boolean {
  if (!progress) return false;
  return progress.goal.every((line) => setAsideOf(progress, line.item) >= line.quantity);
}

export function startChallenge(state: GameState, input: ChallengeStartInput): ChallengeResult {
  if (typeof input.id !== 'string' || input.id === '' || !Number.isFinite(input.deadline) || !isValidLot(input.goal)) return { error: 'error.invalidChallenge' };
  if (state.challenge?.id === input.id) return { state };
  if (state.challenge) return { error: 'error.challengeBusy' };
  const goal = input.goal.map((line) => ({ item: line.item, quantity: line.quantity }));
  return { state: { ...state, challenge: { id: input.id, goal, stock: {}, deadline: input.deadline } } };
}

// Takes units out of the Storehouse for good: they stay with the Challenge whether it succeeds or fails.
export function setAsideForChallenge(state: GameState, item: string, quantity: number): ChallengeResult {
  const progress = state.challenge;
  if (!progress) return { error: 'error.noChallenge' };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: 'error.invalidQuantity' };
  if (!Object.hasOwn(MATERIALS, item) && !Object.hasOwn(GOODS, item)) return { error: 'error.notInChallenge' };
  const remaining = remainingOf(progress, item);
  if (remaining <= 0) return { error: 'error.notInChallenge' };
  if (quantity > remaining) return { error: 'error.challengeSurplus' };
  const storage = debitStorage(state.storage, [{ item, quantity }]);
  if (typeof storage === 'string') return { error: storage };
  return { state: { ...state, storage, challenge: { ...progress, stock: { ...progress.stock, [item]: setAsideOf(progress, item) + quantity } } } };
}

export function clearChallenge(state: GameState): GameState {
  if (!state.challenge) return state;
  const cleared = { ...state };
  delete cleared.challenge;
  return cleared;
}

// Twice the value of the units of the goal.
export function challengeReward(goal: readonly TradeLine[]): number {
  return CHALLENGE_REWARD_MULTIPLIER * goal.reduce((sum, line) => sum + line.quantity * valueOf(line.item as ItemId), 0);
}

export function findChallengeClaim(state: GameState, id: string): ChallengeClaim | undefined {
  return state.challengeClaims?.find((claim) => claim.id === id);
}

// Applies the reward of a completed Challenge exactly once: a second call for the same Challenge changes nothing.
export function completeChallenge(state: GameState, id: string, rewardKind: ChallengeRewardKind, now: number): ChallengeResult {
  if (findChallengeClaim(state, id)) return { state };
  const progress = state.challenge;
  if (!progress || progress.id !== id || !isChallengeStockComplete(progress)) return { error: 'error.noChallenge' };
  const urbs = rewardKind === 'urbs' ? challengeReward(progress.goal) : 0;
  const kept = (state.challengeClaims ?? []).filter((claim) => claim.at >= now - CHALLENGE_CLAIM_RETENTION_MS);
  const cleared = clearChallenge(state);
  return { state: { ...cleared, urbs: cleared.urbs + urbs, challengeClaims: [...kept, { id, at: now, urbs }] } };
}
