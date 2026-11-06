import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { Note } from '../common/Note';
import { bugReportErrorKey } from './bugReportErrorKey';
import { BugReportInboxRow } from './BugReportInboxRow';
import { BugReportThreadView } from './BugReportThreadView';
import { useBugReportInbox } from './useBugReportInbox';

export function BugReportInboxDialog() {
  const reports = useBugReportInbox((store) => store.reports);
  const thread = useBugReportInbox((store) => store.thread);
  const failed = useBugReportInbox((store) => store.failed);
  const { openThread, backToList, closeInbox } = bugReportInboxStore.getState();
  return (
    <Dialog className="bug-report-dialog">
      <Dialog.Title>{t('bugReport.inbox.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="bug-report-body">
          {thread ? <BugReportThreadView thread={thread} /> : null}
          {!thread && failed ? <Note>{t(bugReportErrorKey(failed))}</Note> : null}
          {!thread && reports.length === 0 && !failed ? <Note tone="muted">{t('bugReport.inbox.empty')}</Note> : null}
          {!thread ? reports.map((report) => <BugReportInboxRow key={report.id} report={report} onOpen={(id) => void openThread(id)} />) : null}
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        {thread ? <ActionButton onClick={backToList}>{t('bugReport.inbox.back')}</ActionButton> : null}
        <ActionButton variant="primary" onClick={closeInbox}>{t('bugReport.inbox.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
