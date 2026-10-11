import type { SocialState } from './types';

export function pendingSocialCount(profile: SocialState | null): number {
  if (!profile) return 0;
  return profile.incoming.length + profile.friends.reduce((sum, friend) => sum + friend.unread, 0);
}
