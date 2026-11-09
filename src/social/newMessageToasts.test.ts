import { describe, expect, it } from 'vitest';
import { newMessageToasts } from './newMessageToasts';
import type { Friend, Group, SocialState } from './types';

const friend = (unread: number): Friend => ({ userId: 'u1', handle: 'ada', avatar: null, since: 0, unread, lastMessageAt: null, medals: [] });
const profile = (unread: number) => ({ friends: [friend(unread)] }) as unknown as SocialState;
const group = (unread: number) => ({ id: 'g1', name: 'Club', unread }) as unknown as Group;

describe('newMessageToasts', () => {
  it('names the friend whose unread count grew', () => {
    expect(newMessageToasts({ profile: profile(0), groups: null }, { profile: profile(1), groups: null })).toHaveLength(1);
  });
  it('names the Group whose unread count grew', () => {
    expect(newMessageToasts({ profile: null, groups: [group(0)] }, { profile: null, groups: [group(2)] })).toHaveLength(1);
  });
  it('stays silent on the first load and when nothing grew', () => {
    expect(newMessageToasts({ profile: null, groups: null }, { profile: profile(3), groups: [group(1)] })).toEqual([]);
    expect(newMessageToasts({ profile: profile(2), groups: null }, { profile: profile(1), groups: null })).toEqual([]);
  });
});
