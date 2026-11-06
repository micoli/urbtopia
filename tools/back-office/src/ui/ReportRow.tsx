import { formatDate } from '../domain/format'
import type { ReportSummary } from '../domain/bugReports'
import { ReportStatusBadge } from './ReportStatusBadge'

interface Props {
  report: ReportSummary
  selected: boolean
  onSelect: () => void
}

export function ReportRow({ report, selected, onSelect }: Props) {
  return (
    <li>
      <button className={`flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-zinc-100 ${selected ? 'bg-zinc-200/70' : ''}`} onClick={onSelect}>
        <span className="flex items-center gap-2">
          <ReportStatusBadge status={report.status} />
          {report.adminUnread && <span className="text-[11px] font-semibold text-indigo-600">new message</span>}
          <span className="ml-auto text-xs text-zinc-500">{formatDate(report.createdAt)}</span>
        </span>
        <span className="line-clamp-2 text-sm">{report.description}</span>
      </button>
    </li>
  )
}
