import { advance } from '../core';
import { dialogStore } from '../store/dialogStore';
import { bootResult, gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { createAutosave } from './autosave';
import { saveSession, saveStore } from './instance';
import { readMeta, shouldRemindExport } from './meta';
import { TabOwnership } from './tabOwnership';

const BACKUP_INTERVAL_MS = 10 * 60_000;

export const resumeHandle: { current: () => void } = { current: () => {} };

let persistRequested = false;

function requestPersistence(): void {
  if (persistRequested) return;
  persistRequested = true;
  void navigator.storage?.persist?.();
}

function newToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function installPersistence(): () => void {
  if (bootResult.kind === 'failed') dialogStore.getState().setRecovery({ reason: bootResult.reason, raw: bootResult.raw });

  const autosave = createAutosave({
    save: () => {
      if (readOnlyStore.getState().readOnly) return;
      const outcome = saveSession.save(gameStore.getState().state, Date.now());
      if (outcome.ok) return requestPersistence();
      if (outcome.reason === 'quota') dialogStore.getState().setSaveFailed(true);
    },
  });

  const ownership = new TabOwnership(saveStore, newToken(), {
    onLost: () => readOnlyStore.getState().set(true),
    onRegained: () => {
      const loaded = saveSession.load();
      if (loaded.kind === 'loaded') gameStore.getState().replaceState(advance(loaded.state, Date.now()).state, 'tick');
      readOnlyStore.getState().set(false);
    },
  });
  ownership.claim();
  resumeHandle.current = () => ownership.resume();

  const unsubscribe = gameStore.subscribe((store, previous) => {
    if (store.state === previous.state) return;
    if (store.lastChange === 'tick') return autosave.onPassiveChange();
    autosave.onCommand();
  });

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') return autosave.flush();
    gameStore.getState().tick(Date.now());
  };
  const onStorage = (event: StorageEvent) => ownership.handleStorageChange(event.key);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', autosave.flush);
  window.addEventListener('storage', onStorage);
  const backupTimer = setInterval(() => saveSession.backupNow(), BACKUP_INTERVAL_MS);

  const now = Date.now();
  const meta = readMeta(saveStore, now);
  if (shouldRemindExport({ ...meta, now, lastSavedAt: gameStore.getState().state.lastSeen })) dialogStore.getState().setExportReminder(true);

  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', autosave.flush);
    window.removeEventListener('storage', onStorage);
    clearInterval(backupTimer);
    autosave.dispose();
  };
}
