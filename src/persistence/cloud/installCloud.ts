import { advance } from '../../core';
import { cloudStore } from '../../store/cloudStore';
import { gameStore } from '../../store/gameStore';
import { readOnlyStore } from '../../store/readOnlyStore';
import { parseEnvelope } from '../envelope';
import { saveSession, saveStore } from '../instance';
import { SAVE_KEY } from '../saveStore';
import { cloudEnabled } from './cloudConfig';
import { CloudSync } from './cloudSync';
import { isPlausibleEmail } from './email';
import { loadCloudClient } from './loadCloudClient';
import { CloudError, type CloudAccount } from './types';

const TICK_MS = 30_000;

export function installCloudSync(): () => void {
  if (!cloudEnabled) return () => {};

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
      sendEmailLink: async (email) => {
        const address = email.trim();
        if (!isPlausibleEmail(address)) return cloudStore.getState().setEmailLink({ kind: 'error', reason: 'invalid-email' });
        cloudStore.getState().setEmailLink({ kind: 'sending' });
        try {
          await client.sendEmailLink(address);
          cloudStore.getState().setEmailLink({ kind: 'sent', email: address });
        } catch (error) {
          const reason = error instanceof CloudError && error.kind === 'rate-limited' ? 'rate-limited' : 'failed';
          cloudStore.getState().setEmailLink({ kind: 'error', reason });
        }
      },
      signOut: async () => {
        cloudStore.getState().setEmailLink({ kind: 'idle' });
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
    void engine.start();
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
