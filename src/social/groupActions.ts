import type { GroupActions, GroupConversationState, SocialStore } from '../store/socialStore';
import { SocialError, type Group, type GroupMessage, type SocialClient } from './types';

export type GroupTarget = Pick<SocialStore, 'setGroups' | 'setGroupConversation' | 'setGroupBusy' | 'setGroupFailure'>;

export interface GroupView {
  groups: () => Group[] | null;
  revision: () => number | null;
  conversation: () => GroupConversationState | null;
}

const failureOf = (error: unknown): SocialError => (error instanceof SocialError ? error : new SocialError('unknown'));

export function createGroupActions(client: SocialClient, target: GroupTarget, view: GroupView, afterBlock: () => Promise<void>): GroupActions {
  const lastMessageId = (conversation: GroupConversationState) => conversation.messages[conversation.messages.length - 1]?.id ?? 0;

  const mergeMessages = (conversation: GroupConversationState, fetched: GroupMessage[]): GroupMessage[] => {
    const known = new Set(conversation.messages.map((message) => message.id));
    return [...conversation.messages, ...fetched.filter((message) => !known.has(message.id))];
  };

  const load = async (cursor: number | null) => {
    const snapshot = await client.listGroups(cursor);
    if (!snapshot.changed) return;
    target.setGroups(snapshot.groups, snapshot.revision);
    const open = view.conversation();
    if (open && !snapshot.groups.some((group) => group.id === open.groupId)) target.setGroupConversation(null);
  };

  const refresh = async () => {
    try {
      await load(null);
    } catch {
      // The next poll retries.
    }
  };

  const poll = async () => {
    try {
      await load(view.revision());
    } catch {
      // The next poll retries.
    }
  };

  const pollOpen = async () => {
    const conversation = view.conversation();
    if (!conversation || conversation.loading || conversation.sending) return;
    try {
      const fetched = await client.listGroupMessages(conversation.groupId, lastMessageId(conversation));
      const latest = view.conversation();
      if (!latest || latest.groupId !== conversation.groupId || fetched.length === 0) return;
      target.setGroupConversation({ ...latest, messages: mergeMessages(latest, fetched), failure: null });
    } catch {
      // The next poll retries.
    }
  };

  const run = async (step: () => Promise<void>): Promise<boolean> => {
    target.setGroupFailure(null);
    target.setGroupBusy(true);
    try {
      await step();
      return true;
    } catch (error) {
      const failure = failureOf(error);
      target.setGroupFailure({ error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds });
      return false;
    } finally {
      target.setGroupBusy(false);
      await refresh();
    }
  };

  const close = async () => {
    target.setGroupConversation(null);
    await poll();
  };

  const open = async (groupId: string) => {
    const opened: GroupConversationState = { groupId, messages: [], loading: true, sending: false, failure: null };
    target.setGroupConversation(opened);
    try {
      const messages = await client.listGroupMessages(groupId, 0);
      if (view.conversation()?.groupId !== groupId) return;
      target.setGroupConversation({ ...opened, messages, loading: false });
    } catch (error) {
      const failure = failureOf(error);
      target.setGroupConversation({ ...opened, loading: false, failure: { error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds } });
    }
    await poll();
  };

  const send = async (body: string) => {
    const conversation = view.conversation();
    if (!conversation || body.trim() === '') return;
    target.setGroupConversation({ ...conversation, sending: true, failure: null });
    try {
      await client.sendGroupMessage(conversation.groupId, body);
      const fetched = await client.listGroupMessages(conversation.groupId, lastMessageId(conversation));
      const latest = view.conversation() ?? conversation;
      target.setGroupConversation({ ...latest, messages: mergeMessages(latest, fetched), sending: false, failure: null });
    } catch (error) {
      const failure = failureOf(error);
      const latest = view.conversation() ?? conversation;
      target.setGroupConversation({ ...latest, sending: false, failure: { error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds } });
    }
  };

  const reloadOpen = async () => {
    const conversation = view.conversation();
    if (!conversation) return;
    try {
      const messages = await client.listGroupMessages(conversation.groupId, 0);
      const latest = view.conversation();
      if (latest?.groupId === conversation.groupId) target.setGroupConversation({ ...latest, messages });
    } catch {
      // The next poll retries.
    }
  };

  return {
    refresh,
    poll,
    pollOpen,
    open,
    close,
    send,
    refreshOpen: async () => {
      await pollOpen();
      await poll();
    },
    create: async (name, memberIds) => run(async () => void (await client.createGroup(name, memberIds))),
    rename: (groupId, name) => run(() => client.renameGroup(groupId, name)),
    addMembers: (groupId, memberIds) => run(() => client.addGroupMembers(groupId, memberIds)),
    removeMember: async (groupId, userId) => void (await run(() => client.removeGroupMember(groupId, userId))),
    leave: async (groupId) => {
      const left = await run(() => client.leaveGroup(groupId));
      if (left) target.setGroupConversation(null);
    },
    remove: async (groupId) => {
      const removed = await run(() => client.deleteGroup(groupId));
      if (removed) target.setGroupConversation(null);
    },
    blockMember: async (userId) => {
      const blocked = await run(() => client.block(userId));
      if (!blocked) return;
      await afterBlock();
      await reloadOpen();
    },
  };
}
