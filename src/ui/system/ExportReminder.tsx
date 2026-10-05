import { exportCurrentCity } from '../../persistence/exportCity';
import { saveStore } from '../../persistence/instance';
import { recordReminder } from '../../persistence/meta';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

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
    <OverlayBanner variant="reminder" message={t('reminder.text')}>
      <ActionButton onClick={exportNow}>{t('settings.export')}</ActionButton>
      <ActionButton onClick={dismiss}>{t('reminder.dismiss')}</ActionButton>
    </OverlayBanner>
  );
}
