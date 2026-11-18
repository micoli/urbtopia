import { ALL_TIME, type DateFilter } from '../domain/dateFilter'
import { useDateFilter } from '../store/dateFilterStore'
import { input } from './styles'

type Kind = 'all' | 'last-7' | 'last-14' | 'day' | 'range'

const OPTIONS: { kind: Kind; label: string }[] = [
  { kind: 'all', label: 'All time' },
  { kind: 'last-7', label: 'Last 7 days' },
  { kind: 'last-14', label: 'Last 14 days' },
  { kind: 'day', label: 'A day' },
  { kind: 'range', label: 'A date range' },
]

const kindOf = (filter: DateFilter): Kind => (filter.kind === 'last' ? (filter.days === 7 ? 'last-7' : 'last-14') : filter.kind)

const today = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function filterFor(kind: Kind, previous: DateFilter): DateFilter {
  if (kind === 'all') return ALL_TIME
  if (kind === 'last-7') return { kind: 'last', days: 7 }
  if (kind === 'last-14') return { kind: 'last', days: 14 }
  if (kind === 'day') return { kind: 'day', day: previous.kind === 'day' ? previous.day : today() }
  return previous.kind === 'range' ? previous : { kind: 'range', from: '', to: today() }
}

// Chooses which saves are read: those whose latest save of a user was made in the period.
export function DateFilterBar() {
  const { filter, setFilter } = useDateFilter()
  const current = kindOf(filter)
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2">
      <span className="text-xs text-zinc-500">Latest save made</span>
      <div role="radiogroup" aria-label="Period of the latest save" className="flex rounded-md bg-zinc-200/60 p-0.5">
        {OPTIONS.map(option => (
          <button
            key={option.kind}
            role="radio"
            aria-checked={current === option.kind}
            onClick={() => setFilter(filterFor(option.kind, filter))}
            className={`rounded px-2 py-1 text-xs font-medium transition ${current === option.kind ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {filter.kind === 'day' && <input aria-label="Day" className={`${input} w-40`} type="date" max={today()} value={filter.day} onChange={event => setFilter({ kind: 'day', day: event.target.value })} />}
      {filter.kind === 'range' && (
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <input aria-label="From" className={`${input} w-40`} type="date" max={filter.to || today()} value={filter.from} onChange={event => setFilter({ ...filter, from: event.target.value })} />
          to
          <input aria-label="To" className={`${input} w-40`} type="date" min={filter.from || undefined} max={today()} value={filter.to} onChange={event => setFilter({ ...filter, to: event.target.value })} />
        </span>
      )}
    </div>
  )
}
