import type { Bucket } from '../domain/dashboard'
import { percent } from './chartColors'
import { ChartLegend } from './ChartLegend'

interface Props {
  buckets: Bucket[]
  colors: string[]
}

// One ratio, the first part against the rest: a meter reads better than a donut of two slices.
export function ShareMeter({ buckets, colors }: Props) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const first = buckets[0]
  return (
    <div className="flex flex-col gap-3">
      <p className="text-3xl font-semibold text-zinc-900">{first ? percent(first.count, total) : '0%'}</p>
      <div role="img" aria-label={first ? `${first.label}: ${percent(first.count, total)}` : 'No data'} className="flex h-2 gap-0.5 overflow-hidden rounded-full" style={{ background: 'var(--series-track)' }}>
        {buckets.map((bucket, index) => (bucket.count === 0 ? null : <span key={bucket.label} title={`${bucket.label}: ${bucket.count}`} style={{ width: `${(bucket.count / total) * 100}%`, background: colors[index] }} />))}
      </div>
      <ChartLegend buckets={buckets} colors={colors} />
    </div>
  )
}
