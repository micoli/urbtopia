import type { Bucket } from '../domain/dashboard'
import { formatNumber } from '../domain/format'
import { percent } from './chartColors'
import { ChartLegend } from './ChartLegend'

const SIZE = 112
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

interface Props {
  buckets: Bucket[]
  colors: string[]
  label: string
}

export function DonutChart({ buckets, colors, label }: Props) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const shown = buckets.filter(bucket => bucket.count > 0).length
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg role="img" aria-label={`${label}: ${buckets.map(bucket => `${bucket.label} ${percent(bucket.count, total)}`).join(', ')}`} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--series-track)" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {buckets.map((bucket, index) => {
            if (bucket.count === 0 || total === 0) return null
            const length = (bucket.count / total) * CIRCUMFERENCE
            const drawn = shown === 1 ? length : Math.max(0, length - GAP)
            const start = offset
            offset += length
            return (
              <circle key={bucket.label} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={colors[index]} strokeWidth={STROKE} strokeDasharray={`${drawn} ${CIRCUMFERENCE - drawn}`} strokeDashoffset={-start}>
                <title>{`${bucket.label}: ${formatNumber(bucket.count)} (${percent(bucket.count, total)})`}</title>
              </circle>
            )
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-zinc-900 text-lg font-semibold">{formatNumber(total)}</text>
      </svg>
      <ChartLegend buckets={buckets} colors={colors} />
    </div>
  )
}
