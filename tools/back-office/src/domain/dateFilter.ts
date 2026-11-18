export type DateFilter =
  | { kind: 'all' }
  | { kind: 'last'; days: number }
  | { kind: 'day'; day: string }
  | { kind: 'range'; from: string; to: string }

// Milliseconds, the start included and the end excluded; null leaves that side open.
export interface DateWindow {
  from: number | null
  to: number | null
}

const DAY_MS = 86_400_000
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const ALL_TIME: DateFilter = { kind: 'all' }

// The saves of the last week are the active users.
export const DEFAULT_FILTER: DateFilter = { kind: 'last', days: 7 }

// A day is written YYYY-MM-DD and counted in the Admin's own time zone.
function startOfDay(day: string): number | null {
  const match = DAY_PATTERN.exec(day)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime() : null
}

function startOfNextDay(day: string): number | null {
  const match = DAY_PATTERN.exec(day)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1).getTime() : null
}

export function windowOf(filter: DateFilter, now: number): DateWindow {
  if (filter.kind === 'all') return { from: null, to: null }
  if (filter.kind === 'last') return { from: now - filter.days * DAY_MS, to: null }
  if (filter.kind === 'day') return { from: startOfDay(filter.day), to: startOfNextDay(filter.day) }
  const from = startOfDay(filter.from)
  const to = startOfNextDay(filter.to)
  if (from !== null && to !== null && from >= to) return { from: startOfDay(filter.to), to: startOfNextDay(filter.from) }
  return { from, to }
}

export function inWindow(time: number, window: DateWindow): boolean {
  return (window.from === null || time >= window.from) && (window.to === null || time < window.to)
}

export function describeFilter(filter: DateFilter): string {
  if (filter.kind === 'all') return 'all time'
  if (filter.kind === 'last') return `the last ${filter.days} days`
  if (filter.kind === 'day') return filter.day === '' ? 'all time' : filter.day
  if (filter.from === '' && filter.to === '') return 'all time'
  return `${filter.from === '' ? 'the beginning' : filter.from} to ${filter.to === '' ? 'now' : filter.to}`
}
