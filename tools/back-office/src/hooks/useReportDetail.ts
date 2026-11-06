import { useEffect, useState } from 'react'
import { loadReport, markReportRead, setReportStatus, type ReportDetail } from '../api/bugReports'
import type { AdminClient } from '../api/supabaseAdmin'

export type ReportDetailState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; detail: ReportDetail }

// Opening a new report marks it as seen; opening any report clears its unread flag.
export function useReportDetail(client: AdminClient, id: number, reloadKey: number, onViewed: () => void) {
  const [state, setState] = useState<ReportDetailState>({ kind: 'loading' })

  useEffect(() => {
    let current = true
    const open = async () => {
      const detail = await loadReport(client, id)
      if (detail.status === 'new') await setReportStatus(client, id, 'seen')
      await markReportRead(client, id)
      return detail.status === 'new' ? { ...detail, status: 'seen' as const } : detail
    }
    open()
      .then(detail => {
        if (!current) return
        setState({ kind: 'ready', detail })
        onViewed()
      })
      .catch(error => current && setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
    return () => {
      current = false
    }
  }, [client, id, reloadKey])

  return state
}
