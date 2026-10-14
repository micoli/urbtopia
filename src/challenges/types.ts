import type { TradeLine } from '../core';

export type ChallengeErrorKind = 'offline' | 'unauthenticated' | 'email-required' | 'handle-required' | 'challenge-unavailable' | 'challenge-busy' | 'unknown';

export class ChallengeError extends Error {
  constructor(readonly kind: ChallengeErrorKind) {
    super(`challenge-${kind}`);
  }
}

export type ChallengeKind = 'daily' | 'event';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeRewardKind = 'urbs' | 'medal';

export interface Challenge {
  id: string;
  kind: ChallengeKind;
  difficulty: ChallengeDifficulty | null;
  minCitizens: number;
  goal: TradeLine[];
  rewardKind: ChallengeRewardKind;
  medalCode: string | null;
  nameKeys: { hook: number; item: string };
  nameFr: string | null;
  nameEn: string | null;
  startsAt: number;
  endsAt: number;
}

export interface AcceptedChallenge {
  challengeId: string;
  acceptedAt: number;
  deadline: number;
}

export interface MedalInfo {
  medalCode: string;
  nameFr: string | null;
  nameEn: string | null;
  earnedAt: number;
}

export interface Medal extends MedalInfo {
  challengeId: string;
}

export interface ChallengeSnapshot {
  serverNow: number;
  challenges: Challenge[];
  accepted: AcceptedChallenge | null;
  abandoned: string[];
  medals: Medal[];
}

export interface ChallengeDeclaration {
  challengeId: string;
  rewardKind: ChallengeRewardKind;
  goal: TradeLine[];
  medalCode: string | null;
  alreadyClaimed: boolean;
}

export interface ChallengeClient {
  list(): Promise<ChallengeSnapshot>;
  accept(challengeId: string): Promise<AcceptedChallenge>;
  declare(challengeId: string): Promise<ChallengeDeclaration>;
  abandon(challengeId: string): Promise<void>;
}
