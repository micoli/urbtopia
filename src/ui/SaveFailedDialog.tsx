import { exportCurrentCity } from '../persistence/exportCity';
import { t } from '../i18n/t';
import { dialogStore } from '../store/dialogStore';
import { useDialogs } from './hooks';

export function SaveFailedDialog() {
  const open = useDialogs((store) => store.saveFailed);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="alertdialog" aria-modal="true">
      <div className="dialog">
        <h2>{t('saveFailed.title')}</h2>
        <p>{t('saveFailed.text')}</p>
        <div className="dialog-actions">
          <button type="button" onClick={() => dialogStore.getState().setSaveFailed(false)}>
            {t('saveFailed.close')}
          </button>
          <button type="button" className="dialog-primary" onClick={exportCurrentCity}>
            {t('menu.export')}
          </button>
        </div>
      </div>
    </div>
  );
}
