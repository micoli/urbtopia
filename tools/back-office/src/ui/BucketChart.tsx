import type { Bucket } from '../domain/dashboard'
import { BarList } from './BarList'
import { colorsOf, hueCount, MAX_SLOTS } from './chartColors'
import { ColumnChart } from './ColumnChart'
import { DonutChart } from './DonutChart'
import { ShareMeter } from './ShareMeter'

const MAX_COLUMNS = 8

interface Props {
  buckets: Bucket[]
  label: string
  // share: the parts of one whole. ordered: steps of a scale, read in order. funnel: many ordered steps, read down a list.
  form: 'share' | 'ordered' | 'funnel'
}

// The form follows the data: a ratio is a meter, a few parts a donut, a scale columns, and anything longer ranked bars.
export function BucketChart({ buckets, label, form }: Props) {
  if (buckets.length === 0 || form === 'funnel') return <BarList buckets={buckets} />
  if (form === 'ordered') return buckets.length <= MAX_COLUMNS ? <ColumnChart buckets={buckets} label={label} /> : <BarList buckets={buckets} />
  if (buckets.length <= 2) return <ShareMeter buckets={buckets} colors={colorsOf(buckets)} />
  if (hueCount(buckets) > MAX_SLOTS) return <BarList buckets={buckets} />
  return <DonutChart buckets={buckets} colors={colorsOf(buckets)} label={label} />
}
