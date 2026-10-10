import type { Row } from './comparison'

interface Props {
  rows: Row[]
  tierCount: number
}

const WIDTH = 640
const HEIGHT = 220
const PADDING = { left: 52, right: 16, top: 12, bottom: 28 }
const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea', '#475569', '#db2777']

export function ComparisonCurve({ rows, tierCount }: Props) {
  const values = rows.flatMap(row => row.cells.flatMap(cell => (cell.value === undefined ? [] : [cell.value])))
  if (!values.length || tierCount < 1) return <p className="text-sm text-zinc-500">Nothing to draw.</p>
  const top = Math.max(...values, 1)
  const x = (tier: number) => PADDING.left + (tierCount === 1 ? 0.5 : tier / (tierCount - 1)) * (WIDTH - PADDING.left - PADDING.right)
  const y = (value: number) => PADDING.top + (1 - value / top) * (HEIGHT - PADDING.top - PADDING.bottom)

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full rounded-lg bg-white ring-1 ring-zinc-200" role="img" aria-label="Value by Tier of each Game object">
        {[0, 0.5, 1].map(share => (
          <g key={share}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(top * share)} y2={y(top * share)} stroke="#e4e4e7" />
            <text x={PADDING.left - 6} y={y(top * share) + 4} textAnchor="end" fontSize="10" fill="#71717a">{Math.round(top * share)}</text>
          </g>
        ))}
        {Array.from({ length: tierCount }, (_, tier) => <text key={tier} x={x(tier)} y={HEIGHT - 8} textAnchor="middle" fontSize="10" fill="#71717a">{tier + 1}</text>)}
        {rows.map((row, index) => {
          const points = row.cells.flatMap((cell, tier) => (cell.value === undefined ? [] : [`${x(tier)},${y(cell.value)}`]))
          return points.length ? <polyline key={row.id} points={points.join(' ')} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="2" /> : null
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        {rows.map((row, index) => (
          <span key={row.id} className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
            {row.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
