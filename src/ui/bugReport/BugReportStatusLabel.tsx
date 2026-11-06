import type { BugReportStatus } from '../../bugReports/types';
import { t } from '../../i18n/t';

export function BugReportStatusLabel({ status }: { status: BugReportStatus }) {
  return <span className={`bug-report-status bug-report-status--${status}`}>{t(`bugReport.status.${status}`)}</span>;
}
