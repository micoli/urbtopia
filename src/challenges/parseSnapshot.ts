import { isGood, isMaterial, type TradeLine } from '../core';
import { ChallengeError, type AcceptedChallenge, type Challenge, type ChallengeDeclaration, type ChallengeDifficulty, type ChallengeKind, type ChallengeRewardKind, type ChallengeSnapshot, type Medal, type MedalInfo } from './types';

type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function row(value: unknown): Row {
  if (!isRow(value)) throw new ChallengeError('unknown');
  return value;
}

function rows(value: unknown): Row[] {
  if (!Array.isArray(value)) throw new ChallengeError('unknown');
  return value.map(row);
}

function text(source: Row, key: string): string {
  const value = source[key];
  if (typeof value !== 'string') throw new ChallengeError('unknown');
  return value;
}

function optionalText(source: Row, key: string): string | null {
  const value = source[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new ChallengeError('unknown');
  return value;
}

function number(source: Row, key: string): number {
  const value = source[key];
  if (typeof value !== 'number') throw new ChallengeError('unknown');
  return value;
}

function time(source: Row, key: string): number {
  const parsed = Date.parse(text(source, key));
  if (Number.isNaN(parsed)) throw new ChallengeError('unknown');
  return parsed;
}

function oneOf<T extends string>(source: Row, key: string, allowed: readonly T[]): T {
  const value = text(source, key);
  const found = allowed.find((candidate) => candidate === value);
  if (!found) throw new ChallengeError('unknown');
  return found;
}

function goalOf(source: Row, key: string): TradeLine[] {
  return rows(source[key]).map((line) => ({ item: text(line, 'item'), quantity: number(line, 'quantity') }));
}

function knowsEveryItem(goal: TradeLine[]): boolean {
  return goal.every(({ item }) => isMaterial(item) || isGood(item));
}

function parseChallenge(source: Row): Challenge {
  const keys = row(source.nameKeys);
  const difficulty = optionalText(source, 'difficulty');
  return {
    id: text(source, 'id'),
    kind: oneOf<ChallengeKind>(source, 'kind', ['daily', 'event']),
    difficulty: difficulty === null ? null : oneOf<ChallengeDifficulty>(source, 'difficulty', ['easy', 'medium', 'hard']),
    minCitizens: number(source, 'minCitizens'),
    goal: goalOf(source, 'goal'),
    rewardKind: oneOf<ChallengeRewardKind>(source, 'rewardKind', ['urbs', 'medal']),
    medalCode: optionalText(source, 'medalCode'),
    nameKeys: { hook: number(keys, 'hook'), item: text(keys, 'item') },
    nameFr: optionalText(source, 'nameFr'),
    nameEn: optionalText(source, 'nameEn'),
    startsAt: time(source, 'startsAt'),
    endsAt: time(source, 'endsAt'),
  };
}

function parseMedalInfo(source: Row): MedalInfo {
  return { medalCode: text(source, 'medalCode'), nameFr: optionalText(source, 'nameFr'), nameEn: optionalText(source, 'nameEn'), earnedAt: time(source, 'earnedAt') };
}

function parseAccepted(value: unknown): AcceptedChallenge | null {
  if (value === null || value === undefined) return null;
  const source = row(value);
  return { challengeId: text(source, 'challengeId'), acceptedAt: time(source, 'acceptedAt'), deadline: time(source, 'deadline') };
}

export function parseAcceptance(json: unknown): AcceptedChallenge {
  const accepted = parseAccepted(json);
  if (!accepted) throw new ChallengeError('unknown');
  return accepted;
}

// A Challenge asking for an item this version of the game does not know cannot be played, so it is left out.
export function parseChallengeSnapshot(json: unknown): ChallengeSnapshot {
  const source = row(json);
  return {
    serverNow: time(source, 'now'),
    challenges: rows(source.challenges).map(parseChallenge).filter(({ goal }) => knowsEveryItem(goal)),
    accepted: parseAccepted(source.accepted),
    abandoned: Array.isArray(source.abandoned) ? source.abandoned.filter((id): id is string => typeof id === 'string') : [],
    medals: rows(source.medals).map((medal): Medal => ({ challengeId: optionalText(medal, 'challengeId'), ...parseMedalInfo(medal) })),
  };
}

export function parseDeclaration(json: unknown): ChallengeDeclaration {
  const source = row(json);
  if (typeof source.alreadyClaimed !== 'boolean') throw new ChallengeError('unknown');
  const goal = goalOf(source, 'goal');
  if (!knowsEveryItem(goal)) throw new ChallengeError('unknown');
  return {
    challengeId: text(source, 'challengeId'),
    rewardKind: oneOf<ChallengeRewardKind>(source, 'rewardKind', ['urbs', 'medal']),
    goal,
    medalCode: optionalText(source, 'medalCode'),
    alreadyClaimed: source.alreadyClaimed,
  };
}
