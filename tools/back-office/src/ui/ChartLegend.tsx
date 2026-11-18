import type { Bucket } from '../domain/dashboard'
import { formatNumber } from '../domain/format'
import { percent } from './chartColors'

interface Props {
  buckets: Bucket[]
  colors: string[]
}

export function ChartLegend({ buckets, colors }: Props) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
      {buckets.map((bucket, index) => (
        <li key={bucket.label} className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: colors[index] }} />
          <span className="truncate text-zinc-700" title={bucket.label}>{bucket.label}</span>
          <span className="ml-auto whitespace-nowrap tabular-nums text-zinc-600">{formatNumber(bucket.count)} <span className="text-zinc-400">· {percent(bucket.count, total)}</span></span>
        </li>
      ))}
    </ul>
  )
}
