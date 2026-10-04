import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore.ts';
import { t } from '../../i18n/t.ts';
import { CheckboxField } from './CheckboxField';

export function ReachToggle() {
    const showReach = useStore(prefsStore, (store) => store.showReach);
    return <CheckboxField label={t('facility.showReach')} checked={showReach} onChange={(checked) => prefsStore.getState().setShowReach(checked)} />;
}
