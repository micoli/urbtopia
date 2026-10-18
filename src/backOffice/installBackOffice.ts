import { advance } from '../core';
import { parseEnvelope } from '../persistence/envelope';
import { saveSession, saveStore } from '../persistence/instance';
import { SAVE_KEY } from '../persistence/saveStore';
import { backOfficeStore } from '../store/backOfficeStore';
import { gameStore } from '../store/gameStore';
import { BACK_OFFICE_ORIGINS, isBackOfficeSessionRequested, READY_MESSAGE, readSaveMessage } from './handoff';

export function installBackOffice(): () => void {
  if (!isBackOfficeSessionRequested(window.location.search, import.meta.env.DEV)) return () => {};
  const opener = (window.opener as Window | null) ?? (window.parent === window ? null : window.parent);
  if (!opener) return () => {};

  const onMessage = (event: MessageEvent) => {
    const save = readSaveMessage(event.origin, event.data);
    if (!save) return;
    const parsed = parseEnvelope(save.envelope);
    if (!parsed.ok) return console.warn('back office save refused', parsed.reason);
    saveSession.backupNow();
    saveStore.put(SAVE_KEY, save.envelope);
    gameStore.getState().replaceState(advance(parsed.state, Date.now()).state, 'tick');
    backOfficeStore.getState().setLoaded({ handle: save.handle, revision: save.revision });
  };
  window.addEventListener('message', onMessage);
  for (const origin of BACK_OFFICE_ORIGINS) opener.postMessage({ type: READY_MESSAGE }, origin);

  return () => window.removeEventListener('message', onMessage);
}
