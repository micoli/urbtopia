import { saveSession } from '../../persistence/instance';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { useDialogs } from '../common/hooks';
import { useConfirmKeys } from '../build/useConfirmKeys';

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
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p>{t('import.confirm')}</p>
        <div className="dialog-actions">
          <button type="button" onClick={close}>
            {t('sale.no')}
          </button>
          <button type="button" className="dialog-danger" onClick={replace}>
            {t('import.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}
