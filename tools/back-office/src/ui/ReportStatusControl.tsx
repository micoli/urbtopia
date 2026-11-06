import { useState } from 'react'
import { setReportStatus } from '../api/bugReports'
import type { AdminClient } from '../api/supabaseAdmin'
import type { ReportStatus } from '../domain/bugReports'
import { button } from './styles'

const STATUSES: ReportStatus[] = ['new', 'seen', 'resolved']

interface Props {
  client: AdminClient
  reportId: number
  status: ReportStatus
  onChanged: () => void
}

export function ReportStatusControl({ client, reportId, status, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const change = async (next: ReportStatus) => {
    setBusy(true)
    setError(null)
    try {
      await setReportStatus(client, reportId, next)
      onChanged()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {STATUSES.map(option => (
        <button key={option} className={button(option === status ? 'primary' : 'secondary')} disabled={busy || option === status} onClick={() => void change(option)}>
          {option}
        </button>
      ))}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  )
}
