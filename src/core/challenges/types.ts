import type { TradeLine } from '../trade/types';

// The accepted Challenge as the save knows it: its goal, what has been set aside so far and the server deadline.
export interface ChallengeProgress {
  id: string;
  goal: TradeLine[];
  stock: Partial<Record<string, number>>;
  deadline: number;
}

// A reward already applied, kept for a while so that a repeated completion changes nothing.
export interface ChallengeClaim {
  id: string;
  at: number;
  urbs: number;
}

export type ChallengeRewardKind = 'urbs' | 'medal';

export const CHALLENGE_REWARD_MULTIPLIER = 2;
export const CHALLENGE_CLAIM_RETENTION_MS = 30 * 24 * 3_600_000;
