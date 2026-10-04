import { saveSession } from '../../persistence/instance';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { useDialogs } from '../common/hooks';
import { useConfirmKeys } from '../build/useConfirmKeys';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

export function ImportConfirmDialog() {
  const pending = useDialogs((store) => store.pendingImport);
  const close = () => dialogStore.getState().setPendingImport(null);
  const replace = () => {
    if (!pending) return;
    saveSession.unlock();
    gameStore.getState().replaceState(pending);
    saveSession.save(pending, Date.now());
    close();
  };
  useConfirmKeys({ active: pending !== null, onConfirm: replace, onCancel: close });
  if (!pending) return null;

  return (
    <Dialog>
      <Dialog.Body><p>{t('import.confirm')}</p></Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={close}>{t('sale.no')}</ActionButton>
        <ActionButton variant="danger" onClick={replace}>{t('import.yes')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
