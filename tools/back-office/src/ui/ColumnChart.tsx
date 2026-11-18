import type { Bucket } from '../domain/dashboard'
import { formatNumber } from '../domain/format'

const PLOT_HEIGHT = 96

interface Props {
  buckets: Bucket[]
  label: string
}

// Ordered parts, left to right, on one baseline: one hue, since the order is the message.
export function ColumnChart({ buckets, label }: Props) {
  const largest = Math.max(1, ...buckets.map(bucket => bucket.count))
  return (
    <div role="img" aria-label={`${label}: ${buckets.map(bucket => `${bucket.label} ${bucket.count}`).join(', ')}`} className="flex flex-col gap-1">
      <div className="flex gap-2 border-b border-zinc-200" style={{ height: PLOT_HEIGHT + 18 }}>
        {buckets.map(bucket => (
          <div key={bucket.label} title={`${bucket.label}: ${formatNumber(bucket.count)}`} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <span className="text-xs tabular-nums text-zinc-600">{formatNumber(bucket.count)}</span>
            <span className="w-full max-w-6 rounded-t" style={{ height: Math.max(bucket.count === 0 ? 0 : 3, (bucket.count / largest) * PLOT_HEIGHT), background: 'var(--series-1)' }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {buckets.map(bucket => (
          <span key={bucket.label} title={bucket.label} className="min-w-0 flex-1 text-center text-[11px] leading-tight text-zinc-500">{bucket.label}</span>
        ))}
      </div>
    </div>
  )
}
