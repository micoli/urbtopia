import { useCallback, useEffect, useState } from 'react'
import { listReports } from '../api/bugReports'
import type { AdminClient } from '../api/supabaseAdmin'
import type { ReportSummary } from '../domain/bugReports'

export type ReportsState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; reports: ReportSummary[] }

export const REPORTS_POLL_INTERVAL_MS = 60_000

export function useReports(client: AdminClient) {
  const [state, setState] = useState<ReportsState>({ kind: 'loading' })

  const fetchReports = useCallback(
    (quiet: boolean) => {
      if (!quiet) setState(current => (current.kind === 'ready' ? current : { kind: 'loading' }))
      listReports(client)
        .then(reports => setState({ kind: 'ready', reports }))
        .catch(error => {
          if (quiet) return
          setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) })
        })
    },
    [client],
  )

  const reload = useCallback(() => fetchReports(false), [fetchReports])

  useEffect(reload, [reload])

  useEffect(() => {
    const timer = window.setInterval(() => fetchReports(true), REPORTS_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [fetchReports])

  return { state, reload }
}
