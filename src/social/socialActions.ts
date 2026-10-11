import type { ConversationState, SocialActions, SocialStore } from '../store/socialStore';
import { isPlausibleEmail } from '../persistence/cloud/email';
import { isValidHandle } from './handle';
import { SocialError, type Message, type SocialClient } from './types';

type Target = Pick<SocialStore, 'setStatus' | 'setProfile' | 'setHandleForm' | 'setSearch' | 'setActionFailure' | 'setConversation'>;

export function createSocialActions(
  client: SocialClient,
  target: Target,
  currentRevision: () => number | null = () => null,
  currentConversation: () => ConversationState | null = () => null,
): SocialActions {
  const refresh = async () => {
    target.setStatus('loading');
    try {
      const snapshot = await client.list(null);
      if (!snapshot.changed) return;
      target.setProfile(snapshot);
      target.setStatus('ready');
    } catch (error) {
      if (error instanceof SocialError && error.kind === 'handle-required') {
        target.setProfile(null);
        target.setStatus('no-handle');
        return;
      }
      target.setStatus(error instanceof SocialError && error.kind === 'email-required' ? 'idle' : 'offline');
    }
  };

  const poll = async () => {
    try {
      const snapshot = await client.list(currentRevision());
      if (!snapshot.changed) return;
      target.setProfile(snapshot);
      target.setStatus('ready');
    } catch (error) {
      if (error instanceof SocialError && error.kind === 'handle-required') await refresh();
    }
  };

  const setHandle = async (handle: string) => {
    const candidate = handle.trim();
    if (!isValidHandle(candidate)) return target.setHandleForm({ kind: 'error', error: 'handle-invalid', retryAfterSeconds: null });
    target.setHandleForm({ kind: 'saving' });
    try {
      await client.setHandle(candidate);
    } catch (error) {
      const failure = error instanceof SocialError ? error : new SocialError('unknown');
      return target.setHandleForm({ kind: 'error', error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds });
    }
    target.setHandleForm({ kind: 'idle' });
    await refresh();
  };

  const setFindable = async (findable: boolean) => {
    try {
      await client.setFindable(findable);
    } catch {
      return;
    }
    await refresh();
  };

  const failureOf = (error: unknown): SocialError => (error instanceof SocialError ? error : new SocialError('unknown'));

  const sendRequest = async (email: string) => {
    const address = email.trim();
    if (!isPlausibleEmail(address)) return target.setSearch({ kind: 'invalid-email' });
    target.setSearch({ kind: 'sending' });
    try {
      await client.sendRequestByEmail(address);
    } catch (error) {
      const failure = failureOf(error);
      return target.setSearch({ kind: 'error', error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds });
    }
    target.setSearch({ kind: 'sent' });
    await refresh();
  };

  const act = (run: (userId: string) => Promise<void>) => async (userId: string) => {
    target.setActionFailure(null);
    try {
      await run(userId);
    } catch (error) {
      const failure = failureOf(error);
      target.setActionFailure({ error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds });
    }
    await refresh();
  };

  const lastMessageId = (conversation: ConversationState) => conversation.messages[conversation.messages.length - 1]?.id ?? 0;

  const mergeMessages = (conversation: ConversationState, fetched: Message[]): Message[] => {
    const known = new Set(conversation.messages.map((message) => message.id));
    return [...conversation.messages, ...fetched.filter((message) => !known.has(message.id))];
  };

  const openConversation = async (userId: string, handle: string) => {
    const opened: ConversationState = { userId, handle, messages: [], loading: true, sending: false, failure: null };
    target.setConversation(opened);
    try {
      const messages = await client.listMessages(userId, 0);
      if (currentConversation()?.userId !== userId) return;
      target.setConversation({ ...opened, messages, loading: false });
    } catch (error) {
      const failure = failureOf(error);
      target.setConversation({ ...opened, loading: false, failure: { error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds } });
    }
    await poll();
  };

  const closeConversation = async () => {
    target.setConversation(null);
    await poll();
  };

  const pollConversation = async () => {
    const conversation = currentConversation();
    if (!conversation || conversation.loading || conversation.sending) return;
    try {
      const fetched = await client.listMessages(conversation.userId, lastMessageId(conversation));
      const latest = currentConversation();
      if (!latest || latest.userId !== conversation.userId || fetched.length === 0) return;
      target.setConversation({ ...latest, messages: mergeMessages(latest, fetched), failure: null });
    } catch {
      // The next poll retries.
    }
  };

  const sendMessage = async (body: string) => {
    const conversation = currentConversation();
    if (!conversation || body.trim() === '') return;
    target.setConversation({ ...conversation, sending: true, failure: null });
    try {
      await client.sendMessage(conversation.userId, body);
      const fetched = await client.listMessages(conversation.userId, lastMessageId(conversation));
      const latest = currentConversation() ?? conversation;
      target.setConversation({ ...latest, messages: mergeMessages(latest, fetched), sending: false, failure: null });
    } catch (error) {
      const failure = failureOf(error);
      const latest = currentConversation() ?? conversation;
      target.setConversation({ ...latest, sending: false, failure: { error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds } });
    }
  };

  return {
    openConversation,
    closeConversation,
    sendMessage,
    pollConversation,
    refresh,
    poll,
    setHandle,
    setFindable,
    sendRequest,
    accept: act((userId) => client.acceptRequest(userId)),
    refuse: act((userId) => client.refuseRequest(userId)),
    remove: act((userId) => client.removeFriend(userId)),
    block: act((userId) => client.block(userId)),
    unblock: act((userId) => client.unblock(userId)),
  };
}
