import { describe, expect, it } from 'vitest';
import { pendingExchangesCount, pendingFriendsCount, pendingGroupsCount, pendingSocialCount } from './pendingCount';
import type { Group, SocialState, TradeOffer } from './types';

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  avatar: null,
  findable: true,
  handleChangedAt: 0,
  friends: [
    { userId: 'b', handle: 'Bob', avatar: null, since: 0, unread: 2, lastMessageAt: 0, medals: [] },
    { userId: 'c', handle: 'Carol', avatar: null, since: 0, unread: 1, lastMessageAt: 0, medals: [] },
  ],
  incoming: [{ userId: 'd', handle: 'Dave', avatar: null, at: 0 }],
  outgoing: [{ userId: 'e', handle: 'Erin', avatar: null, at: 0 }],
  blocked: [],
  offers: [],
};

const offer = (change: Partial<TradeOffer>): TradeOffer => ({
  id: 'o', role: 'recipient', peerId: 'x', peerHandle: 'X', peerAvatar: null, lot: [{ item: 'wood', quantity: 1 }], price: 1, state: 'open',
  createdAt: 0, expiresAt: 1, claimDeadline: null, claimable: [], claimed: [], ...change,
});

describe('pendingSocialCount', () => {
  it('adds pending requests received and unread messages', () => {
    expect(pendingSocialCount(profile)).toBe(4);
  });

  it('ignores requests sent and is zero without a profile', () => {
    expect(pendingSocialCount({ ...profile, friends: [], incoming: [] })).toBe(0);
    expect(pendingSocialCount(null)).toBe(0);
  });
});

describe('pendingExchangesCount', () => {
  it('counts received open offers and the slots waiting to be claimed', () => {
    const offers = [
      offer({ id: '1' }),
      offer({ id: '2', role: 'sender' }),
      offer({ id: '3', state: 'accepted', claimable: ['lot'] }),
      offer({ id: '4', role: 'sender', state: 'refused', claimable: ['lot'] }),
      offer({ id: '5', state: 'accepted', claimed: ['lot'] }),
    ];
    expect(pendingExchangesCount({ ...profile, offers })).toBe(3);
  });

  it('adds up with the Friends count in the Social badge', () => {
    const withOffers = { ...profile, offers: [offer({ id: '1' })] };
    expect(pendingFriendsCount(withOffers)).toBe(4);
    expect(pendingSocialCount(withOffers)).toBe(5);
    expect(pendingExchangesCount(null)).toBe(0);
  });
});

describe('pendingGroupsCount', () => {
  const group = (id: string, unread: number): Group => ({ id, name: id, creatorId: 'a', members: [], unread, lastMessageAt: null, lastMessageFrom: null, lastMessagePreview: null });

  it('counts the unread Group messages of every Group', () => {
    expect(pendingGroupsCount([group('1', 5), group('2', 0), group('3', 1)])).toBe(6);
  });

  it('is zero until Groups are loaded', () => {
    expect(pendingGroupsCount(null)).toBe(0);
  });

  it('adds up in the Social badge', () => {
    expect(pendingSocialCount(profile, [group('1', 2)])).toBe(6);
  });
});
