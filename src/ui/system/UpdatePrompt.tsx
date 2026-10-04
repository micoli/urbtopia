import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

export function UpdatePrompt() {
  const ready = useDialogs((store) => store.updateReady);
  if (!ready) return null;

  return (
    <OverlayBanner variant="reminder" className="update-prompt" role="alert" message={t('update.text')}>
      <ActionButton onClick={() => window.location.reload()}>{t('update.reload')}</ActionButton>
      <ActionButton onClick={() => dialogStore.getState().setUpdateReady(false)}>{t('reminder.dismiss')}</ActionButton>
    </OverlayBanner>
  );
}
