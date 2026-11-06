import { useState } from 'react'
import { filterReports, REPORT_FILTERS, type ReportFilter } from '../domain/bugReports'
import type { ReportsState } from '../hooks/useReports'
import { ReportRow } from './ReportRow'
import { button } from './styles'

interface Props {
  state: ReportsState
  selectedId: number | null
  onSelect: (id: number) => void
  onRetry: () => void
}

export function ReportList({ state, selectedId, onSelect, onRetry }: Props) {
  const [filter, setFilter] = useState<ReportFilter>('open')
  return (
    <aside className="flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-3">
        {REPORT_FILTERS.map(option => (
          <button key={option.filter} className={button(filter === option.filter ? 'primary' : 'secondary')} onClick={() => setFilter(option.filter)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {state.kind === 'loading' && <p className="p-3 text-sm text-zinc-500">Loading…</p>}
        {state.kind === 'error' && (
          <div className="flex flex-col items-start gap-2 p-3 text-sm text-red-700">
            <p>Cannot load the reports: {state.message}</p>
            <button className={button()} onClick={onRetry}>Retry</button>
          </div>
        )}
        {state.kind === 'ready' && <ReportRows reports={filterReports(state.reports, filter)} selectedId={selectedId} onSelect={onSelect} />}
      </div>
    </aside>
  )
}

function ReportRows({ reports, selectedId, onSelect }: { reports: ReturnType<typeof filterReports>; selectedId: number | null; onSelect: (id: number) => void }) {
  if (reports.length === 0) return <p className="p-3 text-sm text-zinc-500">No report here.</p>
  return (
    <ul className="divide-y divide-zinc-200">
      {reports.map(report => (
        <ReportRow key={report.id} report={report} selected={report.id === selectedId} onSelect={() => onSelect(report.id)} />
      ))}
    </ul>
  )
}
