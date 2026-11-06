import type { BugReportSummary } from '../../bugReports/types';
import { t } from '../../i18n/t';
import { BugReportStatusLabel } from './BugReportStatusLabel';

interface BugReportInboxRowProps {
  report: BugReportSummary;
  onOpen: (id: number) => void;
}

export function BugReportInboxRow({ report, onOpen }: BugReportInboxRowProps) {
  return (
    <button type="button" className="bug-report-row" onClick={() => onOpen(report.id)}>
      <span className="bug-report-row__text">{report.description}</span>
      {report.unread ? <small className="bug-report-row__new">{t('bugReport.inbox.new')}</small> : null}
      <BugReportStatusLabel status={report.status} />
    </button>
  );
}
