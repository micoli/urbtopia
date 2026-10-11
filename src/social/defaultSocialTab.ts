import type { SocialTab } from '../store/uiStore';

// A player who is not connected yet (no email, or no Handle) lands on Friends, where the sign-in steps are;
// everyone else lands on the first tab.
export function defaultSocialTab(connected: { hasEmail: boolean; status: string }): SocialTab {
  return connected.hasEmail && connected.status !== 'no-handle' ? 'exchanges' : 'friends';
}
