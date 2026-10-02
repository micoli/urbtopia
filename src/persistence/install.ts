import { gameStore } from '../store/gameStore';
import { toastStore } from '../store/toastStore';
import { createAutosave } from './autosave';
import { saveSession } from './instance';

let persistRequested = false;

function requestPersistence(): void {
  if (persistRequested) return;
  persistRequested = true;
  void navigator.storage?.persist?.();
}

export function installPersistence(): () => void {
  const autosave = createAutosave({
    save: () => {
      const outcome = saveSession.save(gameStore.getState().state, Date.now());
      if (outcome.ok) return requestPersistence();
      if (outcome.reason === 'quota') toastStore.getState().show('error.saveFailed');
    },
  });

  const unsubscribe = gameStore.subscribe((store, previous) => {
    if (store.state === previous.state) return;
    if (store.lastChange === 'tick') return autosave.onPassiveChange();
    autosave.onCommand();
  });

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') autosave.flush();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', autosave.flush);

  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', autosave.flush);
    autosave.dispose();
  };
}
