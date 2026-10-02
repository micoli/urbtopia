import { saveSession } from '../persistence/instance';
import { t } from '../i18n/t';
import { dialogStore } from '../store/dialogStore';
import { gameStore } from '../store/gameStore';
import { useDialogs } from './hooks';

export function ImportConfirmDialog() {
  const pending = useDialogs((store) => store.pendingImport);
  if (!pending) return null;

  const close = () => dialogStore.getState().setPendingImport(null);
  const replace = () => {
    saveSession.unlock();
    gameStore.getState().replaceState(pending);
    saveSession.save(pending, Date.now());
    close();
  };

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
