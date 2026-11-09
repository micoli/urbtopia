import { t } from '../i18n/t';
import type { Group, SocialState } from './types';

export interface SocialSnapshot {
  profile: SocialState | null;
  groups: Group[] | null;
}

// One toast text per friend or Group that has more unread messages than before; nothing for what was already loaded or unchanged.
export function newMessageToasts(before: SocialSnapshot, after: SocialSnapshot): string[] {
  const texts: string[] = [];
  if (before.profile && after.profile) {
    const previous = new Map(before.profile.friends.map((friend) => [friend.userId, friend.unread]));
    for (const friend of after.profile.friends) {
      if (friend.unread > (previous.get(friend.userId) ?? friend.unread)) texts.push(t('social.newMessage').replace('{name}', friend.handle));
    }
  }
  if (before.groups && after.groups) {
    const previous = new Map(before.groups.map((group) => [group.id, group.unread]));
    for (const group of after.groups) {
      if (group.unread > (previous.get(group.id) ?? group.unread)) texts.push(t('social.newGroupMessage').replace('{name}', group.name));
    }
  }
  return texts;
}
