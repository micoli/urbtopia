import { exportCurrentCity } from '../persistence/exportCity';
import { saveStore } from '../persistence/instance';
import { recordReminder } from '../persistence/meta';
import { t } from '../i18n/t';
import { dialogStore } from '../store/dialogStore';
import { useDialogs } from './hooks';

export function ExportReminder() {
  const open = useDialogs((store) => store.exportReminder);
  if (!open) return null;

  const dismiss = () => {
    recordReminder(saveStore, Date.now());
    dialogStore.getState().setExportReminder(false);
  };
  const exportNow = () => {
    exportCurrentCity();
    dialogStore.getState().setExportReminder(false);
  };

  return (
    <div className="reminder">
      <span>{t('reminder.text')}</span>
      <button type="button" onClick={exportNow}>
        {t('menu.export')}
      </button>
      <button type="button" onClick={dismiss}>
        {t('reminder.dismiss')}
      </button>
    </div>
  );
}
