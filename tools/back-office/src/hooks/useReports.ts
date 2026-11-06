import { useCallback, useEffect, useState } from 'react'
import { listReports } from '../api/bugReports'
import type { AdminClient } from '../api/supabaseAdmin'
import type { ReportSummary } from '../domain/bugReports'

export type ReportsState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; reports: ReportSummary[] }

export function useReports(client: AdminClient) {
  const [state, setState] = useState<ReportsState>({ kind: 'loading' })

  const reload = useCallback(() => {
    setState(current => (current.kind === 'ready' ? current : { kind: 'loading' }))
    listReports(client)
      .then(reports => setState({ kind: 'ready', reports }))
      .catch(error => setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
  }, [client])

  useEffect(reload, [reload])

  return { state, reload }
}
