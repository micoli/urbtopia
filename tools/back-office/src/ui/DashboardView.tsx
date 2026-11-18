import { useMemo } from 'react'
import type { AdminClient } from '../api/supabaseAdmin'
import { describeFilter } from '../domain/dateFilter'
import { useDateFilter } from '../store/dateFilterStore'
import { buildDashboard } from '../domain/dashboard'
import type { AccountsState } from '../hooks/useAccounts'
import { useSaveFacts } from '../hooks/useSaveFacts'
import { DashboardBody } from './DashboardBody'
import { button } from './styles'

interface Props {
  client: AdminClient
  accounts: AccountsState
}

export function DashboardView({ client, accounts }: Props) {
  const { state, reload } = useSaveFacts(client)
  const filter = useDateFilter(store => store.filter)
  const dashboard = useMemo(() => {
    if (state.kind !== 'ready') return null
    const kinds = new Map(accounts.kind === 'ready' ? accounts.accounts.map(account => [account.id, { anonymous: account.anonymous }]) : [])
    return buildDashboard(state.facts, kinds, Date.now())
  }, [state, accounts])

  if (state.kind === 'loading') {
    return <p className="p-4 text-sm text-zinc-500">Reading the latest saves{state.progress ? ` · ${state.progress.loaded} of ${state.progress.total} users` : '…'}</p>
  }
  if (state.kind === 'error' || dashboard === null) {
    return (
      <div className="flex flex-col items-start gap-2 p-4 text-sm text-red-700">
        <p>Cannot read the saves: {state.kind === 'error' ? state.message : ''}</p>
        <button className={button()} onClick={reload}>Retry</button>
      </div>
    )
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <header className="mb-3 flex items-center gap-3 text-sm text-zinc-600">
        <span>{dashboard.users} users · latest save of each, made in {describeFilter(filter)} · {dashboard.readable} readable by this game version</span>
        <button className={`${button('secondary')} ml-auto`} onClick={reload}>Reload</button>
      </header>
      <DashboardBody dashboard={dashboard} />
    </div>
  )
}
