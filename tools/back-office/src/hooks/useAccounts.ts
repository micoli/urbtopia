import { useCallback, useEffect, useState } from 'react'
import { listAccounts, type AdminClient } from '../api/supabaseAdmin'
import type { AccountSummary } from '../domain/accounts'

export type AccountsState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; accounts: AccountSummary[] }

export function useAccounts(client: AdminClient) {
  const [state, setState] = useState<AccountsState>({ kind: 'loading' })

  const reload = useCallback(() => {
    setState(current => (current.kind === 'ready' ? current : { kind: 'loading' }))
    listAccounts(client)
      .then(accounts => setState({ kind: 'ready', accounts }))
      .catch(error => setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
  }, [client])

  useEffect(reload, [reload])

  return { state, reload }
}
