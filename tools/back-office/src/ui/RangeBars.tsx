import type { Spread } from '../domain/dashboard'
import { formatNumber } from '../domain/format'

interface Props {
  rows: { label: string; spread: Spread | null }[]
}

const LEVELS = [
  { key: 'p95', label: '95th', opacity: 0.25 },
  { key: 'p90', label: '90th', opacity: 0.45 },
  { key: 'p75', label: '75th', opacity: 0.7 },
  { key: 'p50', label: '50th', opacity: 1 },
] as const

// Each row has its own scale, up to its 95th percentile: the bars nest, from the lightest at the 95th to the solid one at the 50th (the median).
export function RangeBars({ rows }: Props) {
  return (
    <ul className="flex flex-col gap-3 text-xs">
      {rows.map(({ label, spread }) => (
        <li key={label} className="flex flex-col gap-1">
          <span className="font-medium text-zinc-700">{label}</span>
          <span role="img" aria-label={spread ? `${label}: ${LEVELS.map(level => `${level.label} percentile ${spread[level.key]}`).reverse().join(', ')}` : `${label}: no data`} className="relative h-2 rounded-full" style={{ background: 'var(--series-track)' }}>
            {spread && LEVELS.map(level => (
              <span key={level.key} className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${spread.p95 === 0 ? 0 : (spread[level.key] / spread.p95) * 100}%`, background: 'var(--series-1)', opacity: level.opacity }} />
            ))}
          </span>
          <span className="flex gap-4 tabular-nums text-zinc-600">
            {spread ? [...LEVELS].reverse().map(level => <span key={level.key}>{level.label} <b>{formatNumber(spread[level.key])}</b></span>) : '—'}
          </span>
        </li>
      ))}
    </ul>
  )
}
