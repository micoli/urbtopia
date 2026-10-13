import type { TradeLine } from '../core';
import { isAvatarId } from './avatar';
import { FakeGroupBook } from './fakeGroupBook';
import { FakeTradeBook } from './fakeTradeBook';
import { isValidHandle } from './handle';
import { HANDLE_CHANGE_DELAY_DAYS, MAX_FRIENDS, MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_MINUTE, MAX_OUTGOING_REQUESTS, SEARCHES_PER_DAY, SEARCHES_PER_HOUR } from './limits';
import { SocialError, type GroupMessage, type GroupsSnapshot, type Message, type SocialClient, type SocialSnapshot, type TradeClaim, type TradeSlot } from './types';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const FORBIDDEN_WORDS = ['admin', 'moderator', 'support', 'urbtopia', 'urbix'];

interface Member {
  userId: string;
  email: string;
  handle: string | null;
  avatar: string | null;
  findable: boolean;
  handleChangedAt: number;
  revision: number;
  searches: number[];
}

interface StoredMessage {
  id: number;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: number;
  read: boolean;
}

interface Link {
  low: string;
  high: string;
  state: 'pending' | 'accepted' | 'blocked';
  actorId: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory world mirroring the server rules, shared by the fake clients of several players.
export class FakeSocialWorld {
  private members = new Map<string, Member>();
  private links: Link[] = [];
  messages: StoredMessage[] = [];
  private nextMessageId = 1;
  readonly trades: FakeTradeBook;
  readonly groups: FakeGroupBook;

  constructor(readonly clock: () => number = () => 0) {
    this.trades = new FakeTradeBook({
      clock,
      bump: (...userIds) => this.bump(...userIds),
      areFriends: (a, b) => this.link(a, b)?.state === 'accepted',
      handleOf: (userId) => this.member(userId).handle ?? '',
      avatarOf: (userId) => this.member(userId).avatar,
    });
    this.groups = new FakeGroupBook({
      clock,
      areFriends: (a, b) => this.link(a, b)?.state === 'accepted',
      hasBlocked: (blocker, blocked) => {
        const link = this.link(blocker, blocked);
        return link?.state === 'blocked' && link.actorId === blocker;
      },
      handleOf: (userId) => this.member(userId).handle ?? '',
      avatarOf: (userId) => this.member(userId).avatar,
      isForbidden: (name) => FORBIDDEN_WORDS.some((word) => name.toLowerCase().includes(word)),
      sentRecently: (userId) => this.sentRecently(userId),
    });
  }

  addPlayer(userId: string, email: string | null = `${userId}@example.com`, handle: string | null = null): FakeSocialClient {
    this.members.set(userId, { userId, email: email ?? '', handle, avatar: null, findable: true, handleChangedAt: 0, revision: 1, searches: [] });
    return new FakeSocialClient(this, userId, email !== null);
  }

  member(userId: string): Member {
    const member = this.members.get(userId);
    if (!member) throw new SocialError('unauthenticated');
    return member;
  }

  byEmail(email: string): Member | undefined {
    const wanted = email.trim().toLowerCase();
    return [...this.members.values()].find((member) => member.handle !== null && member.email.toLowerCase() === wanted);
  }

  handleTaken(handle: string, exceptUserId: string): boolean {
    return [...this.members.values()].some((member) => member.userId !== exceptUserId && member.handle?.toLowerCase() === handle.toLowerCase());
  }

  link(a: string, b: string): Link | undefined {
    const [low, high] = a < b ? [a, b] : [b, a];
    return this.links.find((link) => link.low === low && link.high === high);
  }

  linksOf(userId: string): Link[] {
    return this.links.filter((link) => link.low === userId || link.high === userId);
  }

  friendCount(userId: string): number {
    return this.linksOf(userId).filter((link) => link.state === 'accepted').length;
  }

  outgoingCount(userId: string): number {
    return this.linksOf(userId).filter((link) => link.state === 'pending' && link.actorId === userId).length;
  }

  upsert(a: string, b: string, state: Link['state'], actorId: string): void {
    const existing = this.link(a, b);
    const now = this.clock();
    if (existing) {
      existing.state = state;
      existing.actorId = actorId;
      existing.updatedAt = now;
    } else {
      const [low, high] = a < b ? [a, b] : [b, a];
      this.links.push({ low, high, state, actorId, createdAt: now, updatedAt: now });
    }
    if (state === 'blocked') {
      this.deleteConversation(a, b);
      this.trades.closeBetween(a, b);
    }
    if (state !== 'accepted') this.groups.prune(a, b);
    this.bump(a, b);
  }

  sentRecently(userId: string): number {
    const now = this.clock();
    const sent = [
      ...this.messages.filter((message) => message.senderId === userId).map((message) => message.createdAt),
      ...this.groups.messages.filter((message) => message.senderId === userId).map((message) => message.createdAt),
    ].filter((at) => at > now - MINUTE_MS);
    if (sent.length < MAX_MESSAGES_PER_MINUTE) return 0;
    return Math.max(1, Math.ceil((Math.min(...sent) + MINUTE_MS - now) / 1000));
  }

  addMessage(senderId: string, recipientId: string, body: string): number {
    const id = this.nextMessageId;
    this.nextMessageId += 1;
    this.messages.push({ id, senderId, recipientId, body, createdAt: this.clock(), read: false });
    this.bump(senderId, recipientId);
    return id;
  }

  deleteConversation(a: string, b: string): void {
    this.messages = this.messages.filter((message) => !((message.senderId === a && message.recipientId === b) || (message.senderId === b && message.recipientId === a)));
  }

  remove(a: string, b: string, state: Link['state']): void {
    const existing = this.link(a, b);
    if (!existing || existing.state !== state) return;
    this.links = this.links.filter((link) => link !== existing);
    if (state === 'accepted') {
      this.deleteConversation(a, b);
      this.trades.closeBetween(a, b);
      this.groups.prune(a, b);
    }
    this.bump(a, b);
  }

  bump(...userIds: string[]): void {
    for (const userId of userIds) this.member(userId).revision += 1;
  }

  other(link: Link, userId: string): string {
    return link.low === userId ? link.high : link.low;
  }
}

export class FakeSocialClient implements SocialClient {
  private offline = false;

  constructor(
    private world: FakeSocialWorld,
    readonly userId: string,
    private hasEmail: boolean,
  ) {}

  goOffline(): void {
    this.offline = true;
  }

  goOnline(): void {
    this.offline = false;
  }

  async setHandle(handle: string): Promise<void> {
    const me = this.guard(false);
    if (!isValidHandle(handle)) throw new SocialError('handle-invalid');
    if (FORBIDDEN_WORDS.some((word) => handle.toLowerCase().includes(word))) throw new SocialError('handle-forbidden');
    if (me.handle === handle) return;
    const waitMs = me.handleChangedAt + HANDLE_CHANGE_DELAY_DAYS * DAY_MS - this.world.clock();
    if (me.handle !== null && waitMs > 0) throw new SocialError('handle-change-too-soon', Math.ceil(waitMs / 1000));
    if (this.world.handleTaken(handle, this.userId)) throw new SocialError('handle-taken');
    me.handle = handle;
    me.handleChangedAt = this.world.clock();
    this.world.bump(this.userId);
  }

  async setAvatar(avatar: string | null): Promise<void> {
    const me = this.guard();
    if (avatar !== null && !isAvatarId(avatar)) throw new SocialError('avatar-invalid');
    if (me.avatar === avatar) return;
    me.avatar = avatar;
    this.world.bump(this.userId, ...this.world.linksOf(this.userId).filter((link) => link.state === 'accepted' || link.state === 'pending').map((link) => this.world.other(link, this.userId)));
  }

  async setFindable(findable: boolean): Promise<void> {
    const me = this.guard();
    me.findable = findable;
    this.world.bump(this.userId);
  }

  async sendRequestByEmail(email: string): Promise<void> {
    const me = this.guard();
    const now = this.world.clock();
    me.searches = me.searches.filter((at) => at > now - DAY_MS);
    const lastHour = me.searches.filter((at) => at > now - HOUR_MS);
    const waits = [
      lastHour.length >= SEARCHES_PER_HOUR ? Math.min(...lastHour) + HOUR_MS - now : 0,
      me.searches.length >= SEARCHES_PER_DAY ? Math.min(...me.searches) + DAY_MS - now : 0,
    ];
    const wait = Math.max(...waits);
    if (wait > 0) throw new SocialError('rate-limited', Math.ceil(wait / 1000));
    me.searches.push(now);
    if (this.world.friendCount(this.userId) >= MAX_FRIENDS) throw new SocialError('cap-friends');
    if (this.world.outgoingCount(this.userId) >= MAX_OUTGOING_REQUESTS) throw new SocialError('cap-outgoing');

    const target = this.world.byEmail(email);
    if (!target || !target.findable || target.userId === this.userId) return;
    this.openRequest(target.userId);
  }

  async acceptRequest(userId: string): Promise<void> {
    this.guard();
    const link = this.world.link(this.userId, userId);
    if (!link || link.state !== 'pending' || link.actorId !== userId) throw new SocialError('not-found');
    if (this.world.friendCount(this.userId) >= MAX_FRIENDS || this.world.friendCount(userId) >= MAX_FRIENDS) throw new SocialError('cap-friends');
    this.world.upsert(this.userId, userId, 'accepted', userId);
  }

  async refuseRequest(userId: string): Promise<void> {
    this.guard();
    this.world.remove(this.userId, userId, 'pending');
  }

  async removeFriend(userId: string): Promise<void> {
    this.guard();
    this.world.remove(this.userId, userId, 'accepted');
  }

  async block(userId: string): Promise<void> {
    this.guard();
    if (userId === this.userId || this.world.member(userId).handle === null) throw new SocialError('not-found');
    this.world.upsert(this.userId, userId, 'blocked', this.userId);
  }

  async unblock(userId: string): Promise<void> {
    this.guard();
    const link = this.world.link(this.userId, userId);
    if (link?.state === 'blocked' && link.actorId === this.userId) this.world.remove(this.userId, userId, 'blocked');
  }

  async list(cursor: number | null = null): Promise<SocialSnapshot> {
    const me = this.guard();
    if (cursor === me.revision) return { changed: false, revision: me.revision };
    const links = this.world.linksOf(this.userId);
    const handleOf = (link: (typeof links)[number]) => this.world.member(this.world.other(link, this.userId)).handle ?? '';
    const avatarOf = (link: (typeof links)[number]) => this.world.member(this.world.other(link, this.userId)).avatar;
    const userIdOf = (link: (typeof links)[number]) => this.world.other(link, this.userId);
    return {
      changed: true,
      revision: me.revision,
      handle: me.handle ?? '',
      avatar: me.avatar,
      findable: me.findable,
      handleChangedAt: me.handleChangedAt,
      friends: links
        .filter((link) => link.state === 'accepted')
        .map((link) => ({ userId: userIdOf(link), handle: handleOf(link), avatar: avatarOf(link), since: link.updatedAt, ...this.conversationSummary(userIdOf(link)) }))
        .sort((a, b) => a.handle.toLowerCase().localeCompare(b.handle.toLowerCase())),
      incoming: links
        .filter((link) => link.state === 'pending' && link.actorId !== this.userId)
        .map((link) => ({ userId: userIdOf(link), handle: handleOf(link), avatar: avatarOf(link), at: link.createdAt })),
      outgoing: links
        .filter((link) => link.state === 'pending' && link.actorId === this.userId)
        .map((link) => ({ userId: userIdOf(link), handle: handleOf(link), avatar: avatarOf(link), at: link.createdAt })),
      blocked: links
        .filter((link) => link.state === 'blocked' && link.actorId === this.userId)
        .map((link) => ({ userId: userIdOf(link), handle: handleOf(link), avatar: avatarOf(link) })),
      offers: this.world.trades.listFor(this.userId),
    };
  }

  async sendMessage(userId: string, body: string): Promise<number> {
    this.guard();
    const trimmed = body.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_MESSAGE_LENGTH) throw new SocialError('message-invalid');
    if (this.world.link(this.userId, userId)?.state !== 'accepted') throw new SocialError('not-friends');
    const retry = this.world.sentRecently(this.userId);
    if (retry > 0) throw new SocialError('rate-limited', retry);
    return this.world.addMessage(this.userId, userId, trimmed);
  }

  async listMessages(userId: string, afterId = 0): Promise<Message[]> {
    const me = this.guard();
    if (this.world.link(this.userId, userId)?.state !== 'accepted') throw new SocialError('not-friends');
    const unread = this.world.messages.filter((message) => message.recipientId === this.userId && message.senderId === userId && !message.read);
    for (const message of unread) message.read = true;
    if (unread.length > 0) this.world.bump(me.userId);
    return this.world.messages
      .filter((message) => message.id > afterId && ((message.senderId === this.userId && message.recipientId === userId) || (message.senderId === userId && message.recipientId === this.userId)))
      .slice(-100)
      .map((message) => ({ id: message.id, fromMe: message.senderId === this.userId, body: message.body, at: message.createdAt }));
  }

  async createTradeOffer(id: string, to: string, lot: TradeLine[], price: number): Promise<void> {
    this.guard();
    this.world.trades.create(this.userId, id, to, lot, price);
  }

  async acceptTradeOffer(id: string): Promise<void> {
    this.guard();
    this.world.trades.accept(this.userId, id);
  }

  async declineTradeOffer(id: string): Promise<void> {
    this.guard();
    this.world.trades.decline(this.userId, id);
  }

  async claimTrade(id: string, slot: TradeSlot): Promise<TradeClaim> {
    this.guard();
    return this.world.trades.claim(this.userId, id, slot);
  }

  async listGroups(cursor: number | null = null): Promise<GroupsSnapshot> {
    this.guard();
    return this.world.groups.list(this.userId, cursor);
  }

  async createGroup(name: string, memberIds: string[]): Promise<string> {
    this.guard();
    return this.world.groups.create(this.userId, name, memberIds);
  }

  async renameGroup(groupId: string, name: string): Promise<void> {
    this.guard();
    this.world.groups.rename(this.userId, groupId, name);
  }

  async addGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
    this.guard();
    this.world.groups.add(this.userId, groupId, memberIds);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    this.guard();
    this.world.groups.removeMember(this.userId, groupId, userId);
  }

  async leaveGroup(groupId: string): Promise<void> {
    this.guard();
    this.world.groups.leave(this.userId, groupId);
  }

  async deleteGroup(groupId: string): Promise<void> {
    this.guard();
    this.world.groups.delete(this.userId, groupId);
  }

  async sendGroupMessage(groupId: string, body: string): Promise<number> {
    this.guard();
    return this.world.groups.send(this.userId, groupId, body);
  }

  async listGroupMessages(groupId: string, afterId = 0): Promise<GroupMessage[]> {
    this.guard();
    return this.world.groups.listMessages(this.userId, groupId, afterId);
  }

  private conversationSummary(friendId: string): { unread: number; lastMessageAt: number | null } {
    const talk = this.world.messages.filter((message) => (message.senderId === this.userId && message.recipientId === friendId) || (message.senderId === friendId && message.recipientId === this.userId));
    return {
      unread: talk.filter((message) => message.recipientId === this.userId && !message.read).length,
      lastMessageAt: talk.length === 0 ? null : Math.max(...talk.map((message) => message.createdAt)),
    };
  }

  private openRequest(targetId: string): void {
    const existing = this.world.link(this.userId, targetId);
    if (existing) {
      const crossing = existing.state === 'pending' && existing.actorId === targetId;
      const roomForBoth = this.world.friendCount(this.userId) < MAX_FRIENDS && this.world.friendCount(targetId) < MAX_FRIENDS;
      if (crossing && roomForBoth) this.world.upsert(this.userId, targetId, 'accepted', this.userId);
      return;
    }
    if (this.world.friendCount(targetId) >= MAX_FRIENDS) return;
    this.world.upsert(this.userId, targetId, 'pending', this.userId);
  }

  private guard(requireHandle = true): ReturnType<FakeSocialWorld['member']> {
    if (this.offline) throw new SocialError('offline');
    const me = this.world.member(this.userId);
    if (!this.hasEmail) throw new SocialError('email-required');
    if (requireHandle && me.handle === null) throw new SocialError('handle-required');
    return me;
  }
}
