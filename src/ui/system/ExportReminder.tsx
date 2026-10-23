import { exportCurrentCity } from '../../persistence/exportCity';
import { saveStore } from '../../persistence/instance';
import { readCloudMeta, recordReminder } from '../../persistence/meta';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useCloud, useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

export function ExportReminder() {
  const open = useDialogs((store) => store.exportReminder);
  const cloudEnabled = useCloud((store) => store.enabled);
  const status = useCloud((store) => store.status);
  const signedIn = useCloud((store) => Boolean(store.account?.email));
  const resolvingAccount = cloudEnabled && status.kind === 'idle' && !readCloudMeta(saveStore).paused;
  if (!open || signedIn || resolvingAccount) return null;

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
