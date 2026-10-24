import { advance } from '../../core';
import { isBackOfficeSessionRequested } from '../../backOffice/handoff';
import { showcasePublishHandle } from '../../showcase/publishHandle';
import { cloudStore } from '../../store/cloudStore';
import { gameStore } from '../../store/gameStore';
import { readOnlyStore } from '../../store/readOnlyStore';
import { parseEnvelope } from '../envelope';
import { saveSession, saveStore } from '../instance';
import { SAVE_KEY } from '../saveStore';
import { cloudEnabled } from './cloudConfig';
import { CloudSync } from './cloudSync';
import { isPlausibleEmail } from './email';
import { isKeepLocalRequested } from './keepLocalFlag';
import { loadCloudClient } from './loadCloudClient';
import { localAuthPassword, requestedLocalAuthEmail } from './localAuth';
import { CloudError, type CloudAccount, type CloudSaveClient } from './types';

const TICK_MS = 30_000;

async function startAfterLocalAuth(client: CloudSaveClient, engine: CloudSync): Promise<void> {
  const email = requestedLocalAuthEmail();
  if (email) {
    try {
      const account = await client.account();
      if (account?.email !== email) await client.signInWithPassword(email, localAuthPassword(email));
    } catch (error) {
      console.warn('local-auth failed', error);
    }
  }
  await engine.start();
}

export function installCloudSync(): () => void {
  if (!cloudEnabled || isBackOfficeSessionRequested(window.location.search, import.meta.env.DEV)) return () => {};

  let sync: CloudSync | null = null;
  let editedBeforeReady = false;
  let disposed = false;
  let stopAccountWatch = () => {};
  let knownUserId: string | null = null;

  void loadCloudClient().then((client) => {
    if (!client || disposed) return;
    sync = new CloudSync({
      client,
      store: saveStore,
      now: Date.now,
      canPush: () => !readOnlyStore.getState().readOnly,
      keepLocal: isKeepLocalRequested(window.location.search),
      onPushed: (envelope) => showcasePublishHandle.current(envelope),
      onStatus: (status) => cloudStore.getState().setStatus(status),
      onAccount: (account) => {
        knownUserId = account?.userId ?? null;
        cloudStore.getState().setAccount(account);
      },
      local: {
        adopt: (envelope) => {
          const parsed = parseEnvelope(envelope);
          if (!parsed.ok) return;
          saveSession.backupNow();
          saveStore.put(SAVE_KEY, envelope);
          gameStore.getState().replaceState(advance(parsed.state, Date.now()).state, 'tick');
        },
        keepAsPreviousVersion: () => saveSession.backupNow(),
      },
    });
    const engine = sync;
    if (editedBeforeReady) engine.noteEdit();
    stopAccountWatch = client.onAccountChange((account: CloudAccount | null) => {
      if (!account) return;
      cloudStore.getState().setAccount(account);
      if (knownUserId !== null && account.userId !== knownUserId) setTimeout(() => void engine.accountChanged(), 0);
    });
    cloudStore.getState().enable({
      sendEmailCode: async (email) => {
        const address = email.trim();
        if (!isPlausibleEmail(address)) return cloudStore.getState().setEmailCode({ kind: 'error', reason: 'invalid-email' });
        cloudStore.getState().setEmailCode({ kind: 'sending' });
        try {
          await client.sendEmailCode(address);
          cloudStore.getState().setEmailCode({ kind: 'sent', email: address });
        } catch (error) {
          const reason = error instanceof CloudError && error.kind === 'rate-limited' ? 'rate-limited' : 'failed';
          cloudStore.getState().setEmailCode({ kind: 'error', reason });
        }
      },
      verifyEmailCode: async (code) => {
        const pending = cloudStore.getState().emailCode;
        if (pending.kind !== 'sent') return;
        const { email } = pending;
        if (code.trim() === '') return cloudStore.getState().setEmailCode({ kind: 'sent', email, error: 'invalid-code' });
        cloudStore.getState().setEmailCode({ kind: 'verifying', email });
        try {
          await client.verifyEmailCode(email, code);
        } catch (error) {
          const error_ = error instanceof CloudError && error.kind === 'invalid-code' ? 'invalid-code' : error instanceof CloudError && error.kind === 'rate-limited' ? 'rate-limited' : 'failed';
          return cloudStore.getState().setEmailCode({ kind: 'sent', email, error: error_ });
        }
        cloudStore.getState().setEmailCode({ kind: 'idle' });
        const account = await client.account();
        if (account) cloudStore.getState().setAccount(account);
      },
      cancelEmailCode: () => cloudStore.getState().setEmailCode({ kind: 'idle' }),
      signOut: async () => {
        cloudStore.getState().setEmailCode({ kind: 'idle' });
        await engine.signOut();
      },
      syncNow: () => engine.pushNow(),
      resolveConflict: (choice) => engine.resolveConflict(choice),
      loadVersions: async () => cloudStore.getState().setVersions(await engine.listVersions()),
      restoreVersion: async (revision) => {
        await engine.restoreVersion(revision);
        cloudStore.getState().setVersions(await engine.listVersions());
      },
      deleteCloudData: async () => {
        await engine.deleteCloudData();
        cloudStore.getState().setVersions(null);
      },
    });
    void startAfterLocalAuth(client, engine);
  });

  const unsubscribe = gameStore.subscribe((store, previous) => {
    if (store.state === previous.state || store.lastChange !== 'command') return;
    if (!sync) editedBeforeReady = true;
    sync?.noteEdit();
  });
  const timer = setInterval(() => void sync?.tick(), TICK_MS);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') sync?.pushOnPageHide();
  };
  const onPageHide = () => sync?.pushOnPageHide();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  return () => {
    disposed = true;
    stopAccountWatch();
    unsubscribe();
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  };
}
