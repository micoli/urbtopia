import { GROUP_NAME_MAX, GROUP_NAME_MIN, MAX_GROUP_MEMBERS, MAX_GROUPS_CREATED, MAX_GROUPS_JOINED, MAX_MESSAGE_LENGTH } from './limits';
import { SocialError, type Group, type GroupMessage, type GroupsSnapshot } from './types';

interface StoredGroup {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  createdAt: number;
}

interface StoredGroupMessage {
  id: number;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: number;
}

export interface GroupBookDeps {
  clock: () => number;
  areFriends: (a: string, b: string) => boolean;
  hasBlocked: (blocker: string, blocked: string) => boolean;
  handleOf: (userId: string) => string;
  avatarOf: (userId: string) => string | null;
  isForbidden: (name: string) => boolean;
  sentRecently: (userId: string) => number;
}

// In-memory mirror of the server rules for Groups (ADR 0030).
export class FakeGroupBook {
  messages: StoredGroupMessage[] = [];
  private groups: StoredGroup[] = [];
  private cursors = new Map<string, number>();
  private revisions = new Map<string, number>();
  private nextGroup = 1;
  private nextMessage = 1;

  constructor(private deps: GroupBookDeps) {}

  create(user: string, rawName: string, memberIds: string[]): string {
    const name = this.checkName(rawName);
    if (this.groups.filter((group) => group.creatorId === user).length >= MAX_GROUPS_CREATED) throw new SocialError('cap-groups-created');
    const group: StoredGroup = { id: `group-${this.nextGroup}`, name, creatorId: user, memberIds: [user], createdAt: this.deps.clock() };
    this.nextGroup += 1;
    this.groups.push(group);
    this.addMembers(group, memberIds);
    this.bumpMembers(group);
    return group.id;
  }

  rename(user: string, groupId: string, rawName: string): void {
    const name = this.checkName(rawName);
    const group = this.creatorGroup(user, groupId);
    if (group.name === name) return;
    group.name = name;
    this.bumpMembers(group);
  }

  add(user: string, groupId: string, memberIds: string[]): void {
    const group = this.creatorGroup(user, groupId);
    this.addMembers(group, memberIds);
    this.bumpMembers(group);
  }

  removeMember(user: string, groupId: string, userId: string): void {
    const group = this.creatorGroup(user, groupId);
    if (userId === user || !group.memberIds.includes(userId)) throw new SocialError('not-found');
    group.memberIds = group.memberIds.filter((id) => id !== userId);
    this.bump(userId);
    this.bumpMembers(group);
  }

  leave(user: string, groupId: string): void {
    const group = this.memberGroup(user, groupId);
    if (group.creatorId === user) throw new SocialError('group-creator-cannot-leave');
    group.memberIds = group.memberIds.filter((id) => id !== user);
    this.bump(user);
    this.bumpMembers(group);
  }

  delete(user: string, groupId: string): void {
    const group = this.creatorGroup(user, groupId);
    this.bumpMembers(group);
    this.groups = this.groups.filter((candidate) => candidate !== group);
    this.messages = this.messages.filter((message) => message.groupId !== groupId);
  }

  send(user: string, groupId: string, body: string): number {
    const trimmed = body.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_MESSAGE_LENGTH) throw new SocialError('message-invalid');
    const group = this.memberGroup(user, groupId);
    const retry = this.deps.sentRecently(user);
    if (retry > 0) throw new SocialError('rate-limited', retry);
    const id = this.nextMessage;
    this.nextMessage += 1;
    this.messages.push({ id, groupId, senderId: user, body: trimmed, createdAt: this.deps.clock() });
    this.bumpMembers(group);
    return id;
  }

  listMessages(user: string, groupId: string, afterId: number): GroupMessage[] {
    this.memberGroup(user, groupId);
    const inGroup = this.messages.filter((message) => message.groupId === groupId);
    const last = inGroup.reduce((max, message) => Math.max(max, message.id), 0);
    const key = `${groupId}:${user}`;
    if ((this.cursors.get(key) ?? 0) < last) {
      this.cursors.set(key, last);
      this.bump(user);
    }
    return inGroup
      .filter((message) => message.id > afterId && !this.deps.hasBlocked(user, message.senderId))
      .slice(-100)
      .map((message) => ({
        id: message.id,
        fromMe: message.senderId === user,
        senderId: message.senderId,
        senderHandle: this.deps.handleOf(message.senderId),
        senderAvatar: this.deps.avatarOf(message.senderId),
        body: message.body,
        at: message.createdAt,
      }));
  }

  list(user: string, cursor: number | null): GroupsSnapshot {
    const revision = this.revisions.get(user) ?? 1;
    if (cursor === revision) return { changed: false, revision };
    const groups = this.groups
      .filter((group) => group.memberIds.includes(user))
      .map((group): Group => {
        const visible = this.messages.filter((message) => message.groupId === group.id && !this.deps.hasBlocked(user, message.senderId));
        const last = visible[visible.length - 1];
        const read = this.cursors.get(`${group.id}:${user}`) ?? 0;
        return {
          id: group.id,
          name: group.name,
          creatorId: group.creatorId,
          members: group.memberIds.map((userId) => ({ userId, handle: this.deps.handleOf(userId), avatar: this.deps.avatarOf(userId) })).sort((a, b) => a.handle.toLowerCase().localeCompare(b.handle.toLowerCase())),
          unread: visible.filter((message) => message.id > read && message.senderId !== user).length,
          lastMessageAt: last?.createdAt ?? null,
          lastMessageFrom: last ? this.deps.handleOf(last.senderId) : null,
          lastMessagePreview: last ? last.body.slice(0, 80) : null,
        };
      })
      .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
    return { changed: true, revision, groups };
  }

  // A member who stops being a Friend of the creator leaves the Group.
  prune(a: string, b: string): void {
    for (const group of this.groups) {
      const outsider = group.creatorId === a ? b : group.creatorId === b ? a : null;
      if (outsider === null || !group.memberIds.includes(outsider)) continue;
      group.memberIds = group.memberIds.filter((id) => id !== outsider);
      this.bump(outsider);
      this.bumpMembers(group);
    }
  }

  private addMembers(group: StoredGroup, memberIds: string[]): void {
    for (const userId of new Set(memberIds)) {
      if (userId === group.creatorId || group.memberIds.includes(userId)) continue;
      if (!this.deps.areFriends(group.creatorId, userId)) throw new SocialError('not-friends');
      if (group.memberIds.length >= MAX_GROUP_MEMBERS) throw new SocialError('group-full');
      const joined = this.groups.filter((candidate) => candidate.creatorId !== userId && candidate.memberIds.includes(userId)).length;
      if (joined >= MAX_GROUPS_JOINED) throw new SocialError('cap-groups-joined');
      group.memberIds.push(userId);
      this.bump(userId);
    }
  }

  private checkName(raw: string): string {
    const name = raw.trim();
    if (name.length < GROUP_NAME_MIN || name.length > GROUP_NAME_MAX) throw new SocialError('group-name-invalid');
    if (this.deps.isForbidden(name)) throw new SocialError('group-name-forbidden');
    return name;
  }

  private memberGroup(user: string, groupId: string): StoredGroup {
    const group = this.groups.find((candidate) => candidate.id === groupId);
    if (!group || !group.memberIds.includes(user)) throw new SocialError('not-found');
    return group;
  }

  private creatorGroup(user: string, groupId: string): StoredGroup {
    const group = this.memberGroup(user, groupId);
    if (group.creatorId !== user) throw new SocialError('not-creator');
    return group;
  }

  private bump(userId: string): void {
    this.revisions.set(userId, (this.revisions.get(userId) ?? 1) + 1);
  }

  private bumpMembers(group: StoredGroup): void {
    for (const userId of group.memberIds) this.bump(userId);
  }
}
