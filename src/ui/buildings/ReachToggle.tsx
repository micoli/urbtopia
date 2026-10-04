import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';

export function ReachToggle() {
  const showReach = useStore(prefsStore, (store) => store.showReach);
  return (
    <label className="prefs-toggle">
      <input type="checkbox" checked={showReach} onChange={(event) => prefsStore.getState().setShowReach(event.target.checked)} />
      {t('facility.showReach')}
    </label>
  );
}
