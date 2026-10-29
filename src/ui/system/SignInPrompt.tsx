import { useStore } from 'zustand';
import { totalCitizens } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { saveStore } from '../../persistence/instance';
import { readCloudMeta, readMeta, recordSignInDismissal } from '../../persistence/meta';
import { dialogStore } from '../../store/dialogStore';
import { isSignInPromptAllowed } from '../../store/signInPromptFlag';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { useCloud, useDialogs, useGame } from '../common/hooks';
import { shouldPromptSignIn } from './shouldPromptSignIn';

export function SignInPrompt() {
  const citizens = useGame((store) => totalCitizens(store.state));
  const cloudEnabled = useCloud((store) => store.enabled);
  const account = useCloud((store) => store.account);
  const status = useCloud((store) => store.status);
  const promptPreferred = useStore(prefsStore, (store) => store.signInPrompt);
  const dismissed = useDialogs((store) => store.signInPromptDismissed);
  const now = Date.now();
  const open = shouldPromptSignIn({ citizens, cloudEnabled, account, status, cloudPaused: readCloudMeta(saveStore).paused, enabled: promptPreferred && isSignInPromptAllowed(window.location.search), dismissed, dismissedAt: readMeta(saveStore, now).signInDismissedAt, now });
  if (!open) return null;

  const dismiss = () => {
    recordSignInDismissal(saveStore, Date.now());
    dialogStore.getState().dismissSignInPrompt();
  };
  const never = () => {
    prefsStore.getState().setSignInPrompt(false);
    dialogStore.getState().dismissSignInPrompt();
  };
  const signIn = () => {
    dialogStore.getState().dismissSignInPrompt();
    uiStore.getState().openSettingsForSignIn();
  };

  return (
    <Dialog>
      <Dialog.Title>{t('signInPrompt.title')}</Dialog.Title>
      <Dialog.Body>
        <p>{t('signInPrompt.text')}</p>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={dismiss}>{t('signInPrompt.later')}</ActionButton>
        <ActionButton onClick={never}>{t('signInPrompt.never')}</ActionButton>
        <ActionButton variant="primary" onClick={signIn}>{t('signInPrompt.signIn')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
