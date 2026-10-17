import { isChallengeStockComplete, type Command, type ErrorKey, type GameState } from '../core';
import type { ChallengeActions, ChallengeStore } from '../store/challengeStore';
import { ChallengeError, type ChallengeClient, type ChallengeSnapshot } from './types';

const SIGN_IN_ERRORS = new Set(['unauthenticated', 'email-required', 'handle-required']);

export interface ChallengeGame {
  state: () => GameState;
  apply: (command: Command) => ErrorKey | null;
  persist: () => void;
  canPlay: () => boolean;
}

type Setters = Pick<ChallengeStore, 'setStatus' | 'setSnapshot' | 'setBusy' | 'setFailure' | 'setSuccess'>;

export function createChallengeActions(client: ChallengeClient, store: Setters, current: () => Pick<ChallengeStore, 'status' | 'snapshot'>, game: ChallengeGame): ChallengeActions {
  let claiming = false;

  const clearLocal = (): void => {
    game.apply({ type: 'ChallengeClear' });
    game.persist();
  };

  // Persist-then-call: the reward is applied exactly once whatever the number of declarations, so a crash between the server answer
  // and the local credit is repaired by declaring again at the next poll.
  const claim = async (): Promise<void> => {
    const progress = game.state().challenge;
    if (claiming || !game.canPlay() || !progress || !isChallengeStockComplete(progress)) return;
    claiming = true;
    try {
      const declaration = await client.declare(progress.id);
      const error = game.apply({ type: 'ChallengeComplete', id: progress.id, rewardKind: declaration.rewardKind });
      if (error) return;
      game.persist();
      const credited = game.state().challengeClaims?.find(({ id }) => id === progress.id);
      if (credited) store.setSuccess({ id: progress.id, urbs: credited.urbs, rewardKind: declaration.rewardKind });
      store.setSnapshot(await client.list());
    } catch (error) {
      if (error instanceof ChallengeError && error.kind === 'challenge-unavailable') clearLocal();
      else store.setStatus('offline');
    } finally {
      claiming = false;
    }
  };

  const startAccepted = (snapshot: ChallengeSnapshot): void => {
    const accepted = snapshot.accepted;
    if (!accepted || game.state().challenge) return;
    const challenge = snapshot.challenges.find(({ id }) => id === accepted.challengeId);
    if (!challenge) return;
    game.apply({ type: 'ChallengeStart', id: challenge.id, goal: challenge.goal, deadline: accepted.deadline });
    game.persist();
  };

  // Brings the save in line with the server: starts the accepted Challenge, drops one the server no longer runs, declares a complete stock.
  const reconcile = async (snapshot: ChallengeSnapshot): Promise<void> => {
    if (!game.canPlay()) return;
    const local = game.state().challenge;
    if (local && snapshot.accepted?.challengeId !== local.id) {
      if (isChallengeStockComplete(local)) return claim();
      clearLocal();
    }
    startAccepted(snapshot);
    await claim();
  };

  const load = async (): Promise<void> => {
    try {
      const snapshot = await client.list();
      store.setSnapshot(snapshot);
      store.setStatus('ready');
      await reconcile(snapshot);
    } catch (error) {
      const kind = error instanceof ChallengeError ? error.kind : 'unknown';
      if (!SIGN_IN_ERRORS.has(kind)) return store.setStatus('offline');
      store.setSnapshot(null);
      store.setStatus('sign-in-required');
    }
  };

  const refresh = async (): Promise<void> => {
    if (current().snapshot === null) store.setStatus('loading');
    await load();
  };

  const accept = async (challengeId: string): Promise<boolean> => {
    if (!game.canPlay()) return false;
    if (game.state().challengeClaims?.some(({ id }) => id === challengeId)) {
      store.setFailure('challenge-unavailable');
      return false;
    }
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

  const abandon = async (): Promise<boolean> => {
    const accepted = current().snapshot?.accepted;
    if (!accepted || !game.canPlay()) return false;
    store.setBusy(true);
    store.setFailure(null);
    try {
      await client.abandon(accepted.challengeId);
      clearLocal();
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

  const setAside = async (item: string, quantity: number): Promise<ErrorKey | null> => {
    if (!game.canPlay()) return 'error.noChallenge';
    const error = game.apply({ type: 'ChallengeSetAside', item, quantity });
    if (error) return error;
    game.persist();
    await claim();
    return null;
  };

  return { refresh, poll: load, accept, abandon, setAside };
}
