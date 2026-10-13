import type { SocialTab } from '../store/uiStore';

// A player with an email but no Handle lands on Profile, where the Handle is chosen; a signed-out player lands on Friends
// (the Social window then shows the sign-in prompt); everyone else lands on the first tab.
export function defaultSocialTab(connected: { hasEmail: boolean; status: string }): SocialTab {
  if (!connected.hasEmail) return 'friends';
  return connected.status === 'no-handle' ? 'profile' : 'exchanges';
}
