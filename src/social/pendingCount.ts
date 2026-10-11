import type { SocialState } from './types';

// What the Friends tab asks the player to look at: requests received and unread messages.
export function pendingFriendsCount(profile: SocialState | null): number {
  if (!profile) return 0;
  return profile.incoming.length + profile.friends.reduce((sum, friend) => sum + friend.unread, 0);
}

// What the Exchanges tab asks for: offers received and still open, and what waits to be claimed.
export function pendingExchangesCount(profile: SocialState | null): number {
  if (!profile) return 0;
  return profile.offers.reduce((sum, offer) => sum + (offer.state === 'open' && offer.role === 'recipient' ? 1 : 0) + offer.claimable.length, 0);
}

export function pendingSocialCount(profile: SocialState | null): number {
  return pendingFriendsCount(profile) + pendingExchangesCount(profile);
}
