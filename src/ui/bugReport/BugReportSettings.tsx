import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { cloudStore } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { SettingRow } from '../system/SettingRow';
import { SettingsSection } from '../system/SettingsSection';
import { requestBugReport } from './requestBugReport';
import { useBetaSubscribed } from './useBetaSubscribed';

export function BugReportSettings() {
  const subscribed = useBetaSubscribed();
  const enabled = useStore(cloudStore, (store) => store.enabled);
  const hasEmail = useStore(cloudStore, (store) => store.account?.email != null);
  if (!subscribed || !enabled) return null;
  return (
    <SettingsSection title={t('bugReport.title')} icon="bug">
      <SettingRow label={t('bugReport.title')} description={hasEmail ? t('bugReport.settings.description') : t('bugReport.settings.needEmail')}>
        <ActionButton size="sm" disabled={!hasEmail} onClick={() => void requestBugReport()}>{t('bugReport.title')}</ActionButton>
      </SettingRow>
    </SettingsSection>
  );
}
