import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

interface LeaveRoundDialogProps {
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveRoundDialog({ onStay, onLeave }: LeaveRoundDialogProps) {
  return (
    <Dialog role="alertdialog">
      <Dialog.Body><p>{t('casino.leaveConfirm')}</p></Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={onStay}>{t('casino.keepPlaying')}</ActionButton>
        <ActionButton variant="danger" onClick={onLeave}>{t('casino.leaveAnyway')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
