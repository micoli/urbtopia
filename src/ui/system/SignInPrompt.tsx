import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { saveStore } from '../../persistence/instance';
import { recordSignInDismissal } from '../../persistence/meta';
import { dialogStore } from '../../store/dialogStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { useSignInPromptOpen } from './useSignInPromptOpen';

export function SignInPrompt() {
  const open = useSignInPromptOpen();
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
