import { useStore } from 'zustand';
import { advisorStore } from '../../advisor/advisorStore';
import { prefsStore } from '../../i18n/prefsStore';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';

export function AdvisorButton() {
  const flag = useFeatureFlag('advisor');
  const enabled = useStore(prefsStore, (store) => store.advisor);
  if (!flag || !enabled) return null;
  return <ActionButton block onClick={() => advisorStore.getState().openWindow()}>{t('advisor.open')}</ActionButton>;
}
