import { hashSeed } from '../core';

export const AVATAR_IDS = [
  'character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-female-f',
  'character-male-a', 'character-male-b', 'character-male-c', 'character-male-d', 'character-male-e', 'character-male-f',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export function isAvatarId(value: string): value is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(value);
}

export function defaultAvatarOf(userId: string): AvatarId {
  return AVATAR_IDS[hashSeed(userId) % AVATAR_IDS.length]!;
}

export function avatarOf(userId: string, chosen: string | null): AvatarId {
  return chosen !== null && isAvatarId(chosen) ? chosen : defaultAvatarOf(userId);
}
