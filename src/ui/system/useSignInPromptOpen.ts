import { useStore } from 'zustand';
import { totalCitizens } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { saveStore } from '../../persistence/instance';
import { readCloudMeta, readMeta } from '../../persistence/meta';
import { isSignInPromptAllowed } from '../../store/signInPromptFlag';
import { useCloud, useDialogs, useGame } from '../common/hooks';
import { shouldPromptSignIn } from './shouldPromptSignIn';

export function useSignInPromptOpen(): boolean {
  const citizens = useGame((store) => totalCitizens(store.state));
  const cloudEnabled = useCloud((store) => store.enabled);
  const account = useCloud((store) => store.account);
  const status = useCloud((store) => store.status);
  const promptPreferred = useStore(prefsStore, (store) => store.signInPrompt);
  const dismissed = useDialogs((store) => store.signInPromptDismissed);
  const now = Date.now();
  return shouldPromptSignIn({ citizens, cloudEnabled, account, status, cloudPaused: readCloudMeta(saveStore).paused, enabled: promptPreferred && isSignInPromptAllowed(window.location.search), dismissed, dismissedAt: readMeta(saveStore, now).signInDismissedAt, now });
}
