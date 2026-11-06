import { statusTone, type ReportStatus } from '../domain/bugReports'
import { badge } from './styles'

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <span className={badge(statusTone(status))}>{status}</span>
}
