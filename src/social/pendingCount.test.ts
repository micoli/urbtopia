import { describe, expect, it } from 'vitest';
import { pendingSocialCount } from './pendingCount';
import type { SocialState } from './types';

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  findable: true,
  handleChangedAt: 0,
  friends: [
    { userId: 'b', handle: 'Bob', since: 0, unread: 2, lastMessageAt: 0 },
    { userId: 'c', handle: 'Carol', since: 0, unread: 1, lastMessageAt: 0 },
  ],
  incoming: [{ userId: 'd', handle: 'Dave', at: 0 }],
  outgoing: [{ userId: 'e', handle: 'Erin', at: 0 }],
  blocked: [],
  offers: [],
};

describe('pendingSocialCount', () => {
  it('adds pending requests received and unread messages', () => {
    expect(pendingSocialCount(profile)).toBe(4);
  });

  it('ignores requests sent and is zero without a profile', () => {
    expect(pendingSocialCount({ ...profile, friends: [], incoming: [] })).toBe(0);
    expect(pendingSocialCount(null)).toBe(0);
  });
});
