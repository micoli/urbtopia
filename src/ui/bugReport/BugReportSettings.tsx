import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { cloudStore } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { CountBadge } from '../common/CountBadge';
import { SettingRow } from '../system/SettingRow';
import { openBugReportInbox, requestBugReport } from './requestBugReport';
import { useBugReportInbox } from './useBugReportInbox';

export function BugReportSettings() {
  const enabled = useStore(cloudStore, (store) => store.enabled);
  const hasEmail = useStore(cloudStore, (store) => store.account?.email != null);
  const unread = useBugReportInbox((store) => store.unread);
  if (!enabled) return null;
  return (
    <>
      <SettingRow label={t('bugReport.title')} description={hasEmail ? t('bugReport.settings.description') : t('bugReport.settings.needEmail')}>
        <ActionButton size="sm" disabled={!hasEmail} onClick={requestBugReport}>{t('bugReport.title')}</ActionButton>
      </SettingRow>
      {hasEmail ? (
        <SettingRow label={t('bugReport.inbox.title')}>
          <ActionButton size="sm" onClick={openBugReportInbox}>
            {t('bugReport.inbox.view')}
            <CountBadge count={unread} label={t('bugReport.inbox.new')} />
          </ActionButton>
        </SettingRow>
      ) : null}
    </>
  );
}
