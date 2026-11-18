import { NEUTRAL_LABELS, type Bucket } from '../domain/dashboard'

export const MAX_SLOTS = 6

// The hues go to the parts in the order they come; the parts that say "nothing" take the neutral gray.
export function colorsOf(buckets: readonly Bucket[]): string[] {
  let slot = 0
  return buckets.map(bucket => {
    if (NEUTRAL_LABELS.has(bucket.label)) return 'var(--series-neutral)'
    slot += 1
    return `var(--series-${Math.min(slot, MAX_SLOTS)})`
  })
}

export function hueCount(buckets: readonly Bucket[]): number {
  return buckets.filter(bucket => !NEUTRAL_LABELS.has(bucket.label)).length
}

export const percent = (count: number, total: number): string => (total === 0 ? '0%' : `${Math.round((count / total) * 100)}%`)
