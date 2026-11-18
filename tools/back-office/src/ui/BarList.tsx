import type { Bucket } from '../domain/dashboard'
import { formatNumber } from '../domain/format'

interface Props {
  buckets: Bucket[]
  // The whole the percentages are taken of, when the parts are not exclusive (a City can hold several building types).
  total?: number
}

export function BarList({ buckets, total: whole }: Props) {
  const total = whole ?? buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const largest = whole ?? Math.max(1, ...buckets.map(bucket => bucket.count))
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {buckets.map(bucket => (
        <li key={bucket.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr_5.5rem] items-center gap-2">
          <span className="truncate text-zinc-700" title={bucket.label}>{bucket.label}</span>
          <span className="h-2 rounded" style={{ background: 'var(--series-track)' }}>
            <span className="block h-2 rounded" style={{ width: `${(bucket.count / largest) * 100}%`, background: 'var(--series-1)' }} />
          </span>
          <span className="text-right tabular-nums text-zinc-600">{formatNumber(bucket.count)}{total > 0 && <span className="text-zinc-400"> · {Math.round((bucket.count / total) * 100)}%</span>}</span>
        </li>
      ))}
    </ul>
  )
}
