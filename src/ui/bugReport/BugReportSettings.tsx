import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { cloudStore } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { SettingRow } from '../system/SettingRow';
import { requestBugReport } from './requestBugReport';

export function BugReportSettings() {
  const enabled = useStore(cloudStore, (store) => store.enabled);
  const hasEmail = useStore(cloudStore, (store) => store.account?.email != null);
  if (!enabled) return null;
  return (
    <SettingRow label={t('bugReport.title')} description={hasEmail ? t('bugReport.settings.description') : t('bugReport.settings.needEmail')}>
      <ActionButton size="sm" disabled={!hasEmail} onClick={requestBugReport}>{t('bugReport.title')}</ActionButton>
    </SettingRow>
  );
}
