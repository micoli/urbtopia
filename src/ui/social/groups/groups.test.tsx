import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../i18n/t';
import type { Friend, Group } from '../../../social/types';
import type { GroupActions, GroupConversationState } from '../../../store/socialStore';
import { GroupsPanel } from './GroupsPanel';
import { groupErrorMessage } from './groupErrorMessage';

const asyncNoop = async () => {};
const created = async () => true;

const actions: GroupActions = {
  refresh: asyncNoop, poll: asyncNoop, create: created, rename: created, addMembers: created, removeMember: asyncNoop, blockMember: asyncNoop,
  leave: asyncNoop, remove: asyncNoop, open: asyncNoop, close: asyncNoop, send: asyncNoop, pollOpen: asyncNoop, refreshOpen: asyncNoop,
};

const friends: Friend[] = [
  { userId: 'b', handle: 'Bob', avatar: null, since: 0, unread: 0, lastMessageAt: null, medals: [] },
  { userId: 'c', handle: 'Carol', avatar: null, since: 0, unread: 0, lastMessageAt: null, medals: [] },
];

const group: Group = {
  id: 'g1',
  name: 'Builders',
  creatorId: 'a',
  members: [
    { userId: 'a', handle: 'Alice', avatar: null },
    { userId: 'b', handle: 'Bob', avatar: null },
  ],
  unread: 3,
  lastMessageAt: 1000,
  lastMessageFrom: 'Bob',
  lastMessagePreview: 'Hello team',
};

const conversation = (props: Partial<GroupConversationState> = {}): GroupConversationState => ({
  groupId: 'g1',
  messages: [
    { id: 1, fromMe: false, senderId: 'b', senderHandle: 'Bob', senderAvatar: null, body: 'Hello team', at: 0 },
    { id: 2, fromMe: true, senderId: 'a', senderHandle: 'Alice', senderAvatar: null, body: 'Hi', at: 1000 },
  ],
  loading: false,
  sending: false,
  failure: null,
  ...props,
});

const panel = (props: Partial<Parameters<typeof GroupsPanel>[0]> = {}) =>
  renderToStaticMarkup(<GroupsPanel status="ready" groups={[group]} friends={friends} conversation={null} myUserId="a" busy={false} failure={null} actions={actions} {...props} />);

describe('groups panel', () => {
  it('lists Groups with member count, last message and unread count', () => {
    const html = panel();
    expect(html).toContain('<strong>Builders</strong>');
    expect(html).toContain(t('groups.members').replace('{N}', '2'));
    expect(html).toContain('Bob: Hello team');
    expect(html).toContain(`aria-label="${t('friends.unread')}: 3"`);
    expect(html).toContain(t('groups.new'));
  });

  it('explains Groups when there is none, and sends a player without Friends to add some first', () => {
    expect(panel({ groups: [] })).toContain(t('groups.empty'));
    const html = panel({ groups: [], friends: [] });
    expect(html).toContain(t('groups.emptyNoFriends'));
    expect(html).toMatch(/<button[^>]*disabled[^>]*>[^<]*New group/);
  });

  it('waits, says so offline and points to Profile without a Handle', () => {
    expect(panel({ groups: null })).toContain(t('friends.connecting'));
    expect(panel({ status: 'offline' })).toContain(t('friends.offline'));
    expect(panel({ status: 'no-handle' })).toContain(t('friends.needHandle'));
  });

  it('shows the creator the full menu of an open Group', () => {
    const html = panel({ conversation: conversation() });
    for (const key of ['groups.menu.messages', 'groups.menu.members', 'groups.menu.add', 'groups.menu.rename', 'groups.menu.delete'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain(t('groups.menu.leave'));
    expect(html).toContain('Hello team');
    expect(html).toContain('groups-author');
    expect(html).toContain('maxLength="500"');
  });

  it('shows a member a reduced menu with Leave instead of Delete', () => {
    const html = panel({ conversation: conversation(), myUserId: 'b' });
    expect(html).toContain(t('groups.menu.leave'));
    for (const key of ['groups.menu.add', 'groups.menu.rename', 'groups.menu.delete'] as const) expect(html).not.toContain(t(key));
  });

  it('shows the failure of an action', () => {
    const html = panel({ failure: { error: 'cap-groups-created', retryAfterSeconds: null } });
    expect(html).toContain(t('groups.error.cap-groups-created'));
  });
});

describe('group error messages', () => {
  it('maps the Group errors to their own messages and the others to the Friends ones', () => {
    expect(groupErrorMessage('group-full', null)).toBe(t('groups.error.group-full'));
    expect(groupErrorMessage('not-friends', null)).toBe(t('friends.error.not-friends'));
    expect(groupErrorMessage('rate-limited', 12)).toBe(t('friends.error.message-rate-limited').replace('{N}', '12'));
  });
});
