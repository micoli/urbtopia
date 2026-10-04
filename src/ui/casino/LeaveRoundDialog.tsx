import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';

interface LeaveRoundDialogProps {
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveRoundDialog({ onStay, onLeave }: LeaveRoundDialogProps) {
  return (
    <div className="dialog-backdrop" role="alertdialog" aria-modal="true">
      <div className="dialog">
        <p>{t('casino.leaveConfirm')}</p>
        <ButtonRow align="end">
          <ActionButton onClick={onStay}>{t('casino.keepPlaying')}</ActionButton>
          <ActionButton variant="danger" onClick={onLeave}>{t('casino.leaveAnyway')}</ActionButton>
        </ButtonRow>
      </div>
    </div>
  );
}
