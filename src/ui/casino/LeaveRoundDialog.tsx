import { t } from '../../i18n/t';

interface LeaveRoundDialogProps {
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveRoundDialog({ onStay, onLeave }: LeaveRoundDialogProps) {
  return (
    <div className="dialog-backdrop" role="alertdialog" aria-modal="true">
      <div className="dialog">
        <p>{t('casino.leaveConfirm')}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onStay}>{t('casino.keepPlaying')}</button>
          <button type="button" className="dialog-danger" onClick={onLeave}>{t('casino.leaveAnyway')}</button>
        </div>
      </div>
    </div>
  );
}
