import { useStore } from 'zustand';
import { advisorStore, isAdvisorSupported } from '../../advisor/advisorStore';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { ProgressBar } from '../common/ProgressBar';
import { SwitchField } from '../common/SwitchField';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { SettingsSection } from '../system/SettingsSection';
import { advisorErrorKey } from './advisorErrorKey';
import { useAdvisor } from './useAdvisor';

export function AdvisorSettings() {
  const flag = useFeatureFlag('advisor');
  const enabled = useStore(prefsStore, (store) => store.advisor);
  const phase = useAdvisor((store) => store.phase);
  const progress = useAdvisor((store) => store.progress);
  const error = useAdvisor((store) => store.error);
  if (!flag || !isAdvisorSupported()) return null;
  const { requestEnable, deleteModel } = advisorStore.getState();
  const downloading = phase === 'downloading';
  const toggle = (on: boolean) => (on ? requestEnable() : void deleteModel());
  return (
    <SettingsSection title={t('advisor.setting.label')} icon="settings">
      <SwitchField label={t('advisor.setting.label')} description={t('advisor.setting.description')} checked={enabled || downloading} onChange={toggle} />
      {downloading && <ProgressBar value={progress} max={1} label={t('advisor.setting.downloading').replace('{percent}', String(Math.round(progress * 100)))} />}
      {downloading && <p>{t('advisor.setting.downloading').replace('{percent}', String(Math.round(progress * 100)))}</p>}
      {error && <Note>{t(advisorErrorKey(error))}</Note>}
      {enabled && <ActionButton size="sm" variant="primary" onClick={() => advisorStore.getState().openWindow()}>{t('advisor.open')}</ActionButton>}
      {enabled && <ActionButton size="sm" onClick={() => void deleteModel()}>{t('advisor.setting.delete')}</ActionButton>}
    </SettingsSection>
  );
}
