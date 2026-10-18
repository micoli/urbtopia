import { useEffect, useState } from 'react'
import { loadAccountDetail, type AccountDetail, type AdminClient } from '../api/supabaseAdmin'

export type DetailState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; detail: AccountDetail }

export function useAccountDetail(client: AdminClient, userId: string) {
  const [state, setState] = useState<DetailState>({ kind: 'loading' })

  useEffect(() => {
    let current = true
    setState({ kind: 'loading' })
    loadAccountDetail(client, userId)
      .then(detail => current && setState({ kind: 'ready', detail }))
      .catch(error => current && setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
    return () => {
      current = false
    }
  }, [client, userId])

  return state
}
