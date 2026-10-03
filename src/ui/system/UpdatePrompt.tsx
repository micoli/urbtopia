import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useDialogs } from '../common/hooks';

export function UpdatePrompt() {
  const ready = useDialogs((store) => store.updateReady);
  if (!ready) return null;

  return (
    <div className="reminder update-prompt" role="alert">
      <span>{t('update.text')}</span>
      <button type="button" onClick={() => window.location.reload()}>
        {t('update.reload')}
      </button>
      <button type="button" onClick={() => dialogStore.getState().setUpdateReady(false)}>
        {t('reminder.dismiss')}
      </button>
    </div>
  );
}
