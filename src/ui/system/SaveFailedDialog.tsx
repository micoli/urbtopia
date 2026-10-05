import { exportCurrentCity } from '../../persistence/exportCity';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

export function SaveFailedDialog() {
  const open = useDialogs((store) => store.saveFailed);
  if (!open) return null;

  return (
    <Dialog role="alertdialog">
      <Dialog.Title>{t('saveFailed.title')}</Dialog.Title>
      <Dialog.Body><p>{t('saveFailed.text')}</p></Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={() => dialogStore.getState().setSaveFailed(false)}>{t('saveFailed.close')}</ActionButton>
        <ActionButton variant="primary" onClick={exportCurrentCity}>{t('settings.export')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
