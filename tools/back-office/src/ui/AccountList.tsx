import { useState } from 'react'
import { filterAccounts, pageCount, pageOf, type AccountFilter, type AccountSummary } from '../domain/accounts'
import type { AdminClient } from '../api/supabaseAdmin'
import type { AccountsState } from '../hooks/useAccounts'
import { useLatestSaveStats } from '../hooks/useLatestSaveStats'
import type { SaveStats } from '../domain/saveStats'
import { AccountRow } from './AccountRow'
import { SORT_OPTIONS, sortAccounts, sortNeedsStats, type AccountSortKey, type SortDirection } from '../domain/accountSort'
import { button, input } from './styles'

const FILTERS: { filter: AccountFilter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'email', label: 'Email' },
  { filter: 'anonymous', label: 'Anonymous' },
  { filter: 'banned', label: 'Banned' },
]

interface Props {
  client: AdminClient
  state: AccountsState
  selectedId: string | null
  onSelect: (id: string) => void
  onRetry: () => void
}

export function AccountList({ client, state, selectedId, onSelect, onRetry }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<AccountFilter>('all')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: AccountSortKey | null; direction: SortDirection }>({ key: null, direction: 'desc' })

  const change = (apply: () => void) => {
    apply()
    setPage(0)
  }

  return (
    <aside className="flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-3">
        <input className={input} type="search" placeholder="Search email, Handle or id" value={query} onChange={event => change(() => setQuery(event.target.value))} />
        <div role="radiogroup" aria-label="Filter" className="flex rounded-md bg-zinc-200/60 p-0.5">
          {FILTERS.map(option => (
            <button
              key={option.filter}
              role="radio"
              aria-checked={filter === option.filter}
              onClick={() => change(() => setFilter(option.filter))}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${filter === option.filter ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500" htmlFor="account-sort">Sort by</label>
          <select
            id="account-sort"
            className={`${input} flex-1`}
            value={sort.key ?? ''}
            onChange={event => change(() => {
              const option = SORT_OPTIONS.find(candidate => candidate.key === event.target.value)
              setSort({ key: option?.key ?? null, direction: option?.defaultDirection ?? 'desc' })
            })}
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map(option => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button
            className={button('secondary')}
            disabled={sort.key === null}
            aria-label={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
            title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
            onClick={() => change(() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' }))}
          >
            {sort.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      <Body sort={sort} client={client} state={state} query={query} filter={filter} page={page} setPage={setPage} selectedId={selectedId} onSelect={onSelect} onRetry={onRetry} />
    </aside>
  )
}

interface BodyProps extends Props {
  sort: { key: AccountSortKey | null; direction: SortDirection }
  query: string
  filter: AccountFilter
  page: number
  setPage: (page: number) => void
}

function Body({ sort, client, state, query, filter, page, setPage, selectedId, onSelect, onRetry }: BodyProps) {
  if (state.kind === 'loading') return <p className="p-4 text-sm text-zinc-500">Loading accounts…</p>
  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-2 p-4 text-sm text-red-700">
        <p>Cannot load accounts: {state.message}</p>
        <button className={button()} onClick={onRetry}>Retry</button>
      </div>
    )
  }
  return <Accounts sort={sort} client={client} accounts={state.accounts} query={query} filter={filter} page={page} setPage={setPage} selectedId={selectedId} onSelect={onSelect} />
}

interface AccountsProps extends Pick<BodyProps, 'sort' | 'client' | 'query' | 'filter' | 'page' | 'setPage' | 'selectedId' | 'onSelect'> {
  accounts: AccountSummary[]
}

function Accounts({ sort, client, accounts, query, filter, page, setPage, selectedId, onSelect }: AccountsProps) {
  const filtered = filterAccounts(accounts, query, filter, Date.now())
  const pages = pageCount(filtered.length)
  const current = Math.min(page, pages - 1)
  const wanted = sortNeedsStats(sort.key) ? filtered : pageOf(filtered, current)
  const stats: Map<string, SaveStats> = useLatestSaveStats(client, wanted.map(account => account.id))
  const matches = sortAccounts(filtered, sort.key, sort.direction, stats)
  const visible = pageOf(matches, current)
  const loadingStats = sortNeedsStats(sort.key) && wanted.some(account => !stats.has(account.id))
  return (
    <>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.map(account => (
          <AccountRow key={account.id} account={account} stats={stats.get(account.id)} selected={account.id === selectedId} onSelect={() => onSelect(account.id)} />
        ))}
        {matches.length === 0 && <li className="p-4 text-sm text-zinc-500">No account matches.</li>}
      </ul>
      <footer className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">
        <span>{matches.length} of {accounts.length}{loadingStats ? ' · loading stats…' : ''}</span>
        <span className="flex items-center gap-1">
          <button className={button('ghost')} disabled={current === 0} onClick={() => setPage(current - 1)}>‹</button>
          {current + 1} / {pages}
          <button className={button('ghost')} disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>›</button>
        </span>
      </footer>
    </>
  )
}
