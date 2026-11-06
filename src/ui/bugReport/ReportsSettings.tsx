import {useEffect} from 'react';
import {useStore} from 'zustand';
import {bugReportInboxStore} from '../../bugReports/bugReportInboxStore';
import {t} from '../../i18n/t';
import {cloudStore} from '../../store/cloudStore';
import {ActionButton} from '../common/ActionButton';
import {Note} from '../common/Note';
import {SettingsSection} from '../system/SettingsSection';
import {bugReportErrorKey} from './bugReportErrorKey';
import {BugReportInboxRow} from './BugReportInboxRow';
import {BugReportThreadView} from './BugReportThreadView';
import {useBugReportInbox} from './useBugReportInbox';
import {BugReportSettings} from "./BugReportSettings.tsx";

export function ReportsSettings() {
  const hasEmail = useStore(cloudStore, (store) => store.account?.email != null);
  const reports = useBugReportInbox((store) => store.reports);
  const thread = useBugReportInbox((store) => store.thread);
  const failed = useBugReportInbox((store) => store.failed);
  const {openThread, backToList, refresh} = bugReportInboxStore.getState();

  useEffect(() => {
    if (hasEmail) void refresh();
    return backToList;
  }, [hasEmail, refresh, backToList]);

  return (
    <>
      <BugReportSettings/>
      <SettingsSection title={t('bugReport.inbox.title')} icon="messages">
        <div className="bug-report-body">
          {!hasEmail ? <Note tone="muted">{t('bugReport.settings.needEmail')}</Note> : null}
          {thread ? <ActionButton size="sm" onClick={backToList}>{t('bugReport.inbox.back')}</ActionButton> : null}
          {thread ? <BugReportThreadView thread={thread}/> : null}
          {!thread && failed ? <Note>{t(bugReportErrorKey(failed))}</Note> : null}
          {!thread && hasEmail && reports.length === 0 && !failed ? <Note tone="muted">{t('bugReport.inbox.empty')}</Note> : null}
          {!thread ? reports.map((report) => <BugReportInboxRow key={report.id} report={report} onOpen={(id) => void openThread(id)}/>) : null}
        </div>
      </SettingsSection>
    </>
  );
}
