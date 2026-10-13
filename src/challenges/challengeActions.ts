import type { ChallengeActions, ChallengeStore } from '../store/challengeStore';
import { ChallengeError, type ChallengeClient } from './types';

const SIGN_IN_ERRORS = new Set(['unauthenticated', 'email-required', 'handle-required']);

export function createChallengeActions(client: ChallengeClient, store: Pick<ChallengeStore, 'setStatus' | 'setSnapshot' | 'setBusy' | 'setFailure'>, current: () => Pick<ChallengeStore, 'status' | 'snapshot'>): ChallengeActions {
  const load = async (): Promise<void> => {
    try {
      store.setSnapshot(await client.list());
      store.setStatus('ready');
    } catch (error) {
      const kind = error instanceof ChallengeError ? error.kind : 'unknown';
      if (SIGN_IN_ERRORS.has(kind)) {
        store.setSnapshot(null);
        return store.setStatus('sign-in-required');
      }
      store.setStatus('offline');
    }
  };

  const refresh = async (): Promise<void> => {
    if (current().snapshot === null) store.setStatus('loading');
    await load();
  };

  const accept = async (challengeId: string): Promise<boolean> => {
    store.setBusy(true);
    store.setFailure(null);
    try {
      await client.accept(challengeId);
      await load();
      return true;
    } catch (error) {
      store.setFailure(error instanceof ChallengeError ? error.kind : 'unknown');
      if (error instanceof ChallengeError && error.kind === 'challenge-unavailable') await load();
      return false;
    } finally {
      store.setBusy(false);
    }
  };

  return { refresh, poll: load, accept };
}
