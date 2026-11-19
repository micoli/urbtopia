import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

interface DistrictGiveUpDialogProps {
  onStay: () => void;
  onGiveUp: () => void;
}

export function DistrictGiveUpDialog({ onStay, onGiveUp }: DistrictGiveUpDialogProps) {
  return (
    <Dialog role="alertdialog">
      <Dialog.Body><p>{t('district.giveUpConfirm')}</p></Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={onStay}>{t('district.keepPlaying')}</ActionButton>
        <ActionButton variant="danger" onClick={onGiveUp}>{t('district.giveUp')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
