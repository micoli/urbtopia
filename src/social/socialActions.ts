import type { SocialActions, SocialStore } from '../store/socialStore';
import { isPlausibleEmail } from '../persistence/cloud/email';
import { isValidHandle } from './handle';
import { SocialError, type SocialClient } from './types';

type Target = Pick<SocialStore, 'setStatus' | 'setProfile' | 'setHandleForm' | 'setSearch' | 'setActionFailure'>;

export function createSocialActions(client: SocialClient, target: Target): SocialActions {
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

  return {
    refresh,
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
