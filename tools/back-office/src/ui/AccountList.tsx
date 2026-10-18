import { useState } from 'react'
import { filterAccounts, pageCount, pageOf, type AccountFilter } from '../domain/accounts'
import type { AccountsState } from '../hooks/useAccounts'
import { AccountRow } from './AccountRow'
import { button, input } from './styles'

const FILTERS: { filter: AccountFilter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'email', label: 'Email' },
  { filter: 'anonymous', label: 'Anonymous' },
  { filter: 'banned', label: 'Banned' },
]

interface Props {
  state: AccountsState
  selectedId: string | null
  onSelect: (id: string) => void
  onRetry: () => void
}

export function AccountList({ state, selectedId, onSelect, onRetry }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<AccountFilter>('all')
  const [page, setPage] = useState(0)

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
      </div>
      <Body state={state} query={query} filter={filter} page={page} setPage={setPage} selectedId={selectedId} onSelect={onSelect} onRetry={onRetry} />
    </aside>
  )
}

interface BodyProps extends Props {
  query: string
  filter: AccountFilter
  page: number
  setPage: (page: number) => void
}

function Body({ state, query, filter, page, setPage, selectedId, onSelect, onRetry }: BodyProps) {
  if (state.kind === 'loading') return <p className="p-4 text-sm text-zinc-500">Loading accounts…</p>
  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-2 p-4 text-sm text-red-700">
        <p>Cannot load accounts: {state.message}</p>
        <button className={button()} onClick={onRetry}>Retry</button>
      </div>
    )
  }
  const matches = filterAccounts(state.accounts, query, filter, Date.now())
  const pages = pageCount(matches.length)
  const current = Math.min(page, pages - 1)
  return (
    <>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {pageOf(matches, current).map(account => (
          <AccountRow key={account.id} account={account} selected={account.id === selectedId} onSelect={() => onSelect(account.id)} />
        ))}
        {matches.length === 0 && <li className="p-4 text-sm text-zinc-500">No account matches.</li>}
      </ul>
      <footer className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">
        <span>{matches.length} of {state.accounts.length}</span>
        <span className="flex items-center gap-1">
          <button className={button('ghost')} disabled={current === 0} onClick={() => setPage(current - 1)}>‹</button>
          {current + 1} / {pages}
          <button className={button('ghost')} disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>›</button>
        </span>
      </footer>
    </>
  )
}
