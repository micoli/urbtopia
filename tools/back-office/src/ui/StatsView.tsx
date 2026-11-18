import { useMemo, useState } from 'react'
import type { AdminClient } from '../api/supabaseAdmin'
import { accountLabel } from '../domain/accounts'
import { describeFilter } from '../domain/dateFilter'
import { useDateFilter } from '../store/dateFilterStore'
import { buildPrefsTable } from '../domain/savedPrefsTable'
import type { AccountsState } from '../hooks/useAccounts'
import { useSavedPrefs } from '../hooks/useSavedPrefs'
import { PrefsTable, type PrefsSort } from './PrefsTable'
import { button } from './styles'

interface Props {
  client: AdminClient
  accounts: AccountsState
  onOpenAccount: (userId: string) => void
}

export function StatsView({ client, accounts, onOpenAccount }: Props) {
  const { state, reload } = useSavedPrefs(client)
  const filter = useDateFilter(store => store.filter)
  const [sort, setSort] = useState<PrefsSort>({ key: null, direction: 'desc' })
  const table = useMemo(() => {
    if (state.kind !== 'ready') return null
    const known = new Map(accounts.kind === 'ready' ? accounts.accounts.map(account => [account.id, accountLabel(account)]) : [])
    return buildPrefsTable(state.saves, userId => known.get(userId) ?? userId.slice(0, 8))
  }, [state, accounts])

  const sortBy = (key: string | null) => setSort(current => (current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: key === null ? 'desc' : 'asc' }))

  if (state.kind === 'loading') return <p className="p-4 text-sm text-zinc-500">Loading the latest saves…</p>
  if (state.kind === 'error' || table === null) {
    return (
      <div className="flex flex-col items-start gap-2 p-4 text-sm text-red-700">
        <p>Cannot load the saves: {state.kind === 'error' ? state.message : ''}</p>
        <button className={button()} onClick={reload}>Retry</button>
      </div>
    )
  }
  const withPrefs = table.rows.filter(row => Object.keys(row.prefs).length > 0).length
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2 p-3">
      <header className="flex items-center gap-3 text-sm text-zinc-600">
        <span>{table.rows.length} users · latest save made in {describeFilter(filter)} · {withPrefs} with preferences in their latest save · {table.columns.length} preferences</span>
        <button className={`${button('secondary')} ml-auto`} onClick={reload}>Reload</button>
      </header>
      {table.rows.length === 0 ? <p className="text-sm text-zinc-500">No Cloud save yet.</p> : <PrefsTable table={table} sort={sort} onSort={sortBy} onOpenAccount={onOpenAccount} />}
    </section>
  )
}
