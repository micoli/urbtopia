import { DIFFICULTIES, TUTORIAL_STEPS } from '../../../../src/core'
import { formatPrefValue } from './savedPrefsTable'
import type { SaveFacts } from './saveFacts'

export interface Bucket {
  label: string
  count: number
}

export interface Spread {
  p50: number
  p75: number
  p90: number
  p95: number
}

export interface Dashboard {
  users: number
  readable: number
  activity: { accountKind: Bucket[]; recency: Bucket[]; cities: Bucket[] }
  progression: { citizens: Bucket[]; spreads: { label: string; spread: Spread | null }[]; tutorial: Bucket[] }
  settings: { difficulty: Bucket[]; politics: Bucket[]; challenge: Bucket[]; formatVersion: Bucket[] }
  prefs: { key: string; values: Bucket[] }[]
  health: { readability: Bucket[]; prefsCoverage: Bucket[]; size: Bucket[]; largestSize: number }
}

export interface AccountKinds {
  get(userId: string): { anonymous: boolean } | undefined
}

export const NOT_IN_SAVE = '— not in the save'
export const OTHER_VALUES = 'other values'
// Parts that say "nothing to see here" take the neutral gray, so the hues stay for the parts that carry a meaning.
export const NEUTRAL_LABELS: ReadonlySet<string> = new Set([NOT_IN_SAVE, OTHER_VALUES, 'No politics', 'No challenge', 'No preferences', 'Unknown account'])

export const SAVE_SIZE_LIMIT = 1_048_576
const DAY_MS = 86_400_000
const TOP_VALUES = 8

const count = (label: string, predicate: () => number): Bucket => ({ label, count: predicate() })

// Nearest-rank percentile of the values, which need not be sorted.
export function spreadOf(values: readonly number[]): Spread | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = (share: number) => sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)]!
  return { p50: rank(0.5), p75: rank(0.75), p90: rank(0.9), p95: rank(0.95) }
}

function tally(labels: readonly string[], order: readonly string[] = []): Bucket[] {
  const counts = new Map<string, number>()
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  const known = order.filter(label => counts.has(label)).map(label => ({ label, count: counts.get(label)! }))
  const others = [...counts].filter(([label]) => !order.includes(label)).map(([label, total]) => ({ label, count: total })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  return [...known, ...others]
}

function inTranches(values: readonly number[], tranches: readonly { label: string; below: number }[]): Bucket[] {
  return tranches.map((tranche, index) => {
    const from = index === 0 ? -Infinity : tranches[index - 1]!.below
    return count(tranche.label, () => values.filter(value => value >= from && value < tranche.below).length)
  })
}

const CITIZEN_TRANCHES = [
  { label: '0–99', below: 100 },
  { label: '100–999', below: 1000 },
  { label: '1,000–9,999', below: 10_000 },
  { label: '10,000+', below: Infinity },
]

const SIZE_TRANCHES = [
  { label: 'under 25% of the limit', below: SAVE_SIZE_LIMIT * 0.25 },
  { label: '25–50%', below: SAVE_SIZE_LIMIT * 0.5 },
  { label: '50–75%', below: SAVE_SIZE_LIMIT * 0.75 },
  { label: '75% or more', below: Infinity },
]

function prefDistributions(saves: readonly SaveFacts[]): Dashboard['prefs'] {
  const keys = [...new Set(saves.flatMap(save => Object.keys(save.prefs)))].sort((a, b) => a.localeCompare(b))
  return keys.map(key => {
    const values = tally(saves.map(save => (Object.hasOwn(save.prefs, key) ? formatPrefValue(save.prefs[key]) : NOT_IN_SAVE)))
    const shown = values.slice(0, TOP_VALUES)
    const rest = values.slice(TOP_VALUES).reduce((sum, bucket) => sum + bucket.count, 0)
    return { key, values: rest > 0 ? [...shown, { label: OTHER_VALUES, count: rest }] : shown }
  })
}

// Every figure comes from the latest save of each user, whatever the preferences the game knows today.
export function buildDashboard(saves: readonly SaveFacts[], accounts: AccountKinds, now: number): Dashboard {
  const cities = saves.flatMap(save => (save.city.readable ? [save.city.facts] : []))
  const age = (save: SaveFacts) => now - Date.parse(save.savedAt)
  const yesNo = (flag: (city: (typeof cities)[number]) => boolean, yes: string, no: string) => [count(yes, () => cities.filter(flag).length), count(no, () => cities.filter(city => !flag(city)).length)]
  return {
    users: saves.length,
    readable: cities.length,
    activity: {
      accountKind: [
        count('Email', () => saves.filter(save => accounts.get(save.userId)?.anonymous === false).length),
        count('Anonymous', () => saves.filter(save => accounts.get(save.userId)?.anonymous === true).length),
        count('Unknown account', () => saves.filter(save => accounts.get(save.userId) === undefined).length),
      ],
      recency: [
        count('Saved in the last 7 days', () => saves.filter(save => age(save) <= 7 * DAY_MS).length),
        count('8 to 30 days ago', () => saves.filter(save => age(save) > 7 * DAY_MS && age(save) <= 30 * DAY_MS).length),
        count('More than 30 days ago', () => saves.filter(save => age(save) > 30 * DAY_MS).length),
      ],
      cities: tally(saves.map(save => `${save.cityIds.length} ${save.cityIds.length === 1 ? 'city' : 'cities'}`), ['1 city', '2 cities', '3 cities']),
    },
    progression: {
      citizens: inTranches(cities.map(city => city.citizens), CITIZEN_TRANCHES),
      spreads: [
        { label: 'Citizens', spread: spreadOf(cities.map(city => city.citizens)) },
        { label: 'Urbs', spread: spreadOf(cities.map(city => city.urbs)) },
        { label: 'Buildings', spread: spreadOf(cities.map(city => city.buildings)) },
        { label: 'Owned parcels', spread: spreadOf(cities.map(city => city.parcels)) },
      ],
      tutorial: tally(cities.map(city => city.tutorialStep ?? 'over'), [...TUTORIAL_STEPS, 'over']),
    },
    settings: {
      difficulty: tally(cities.map(city => city.difficulty), DIFFICULTIES),
      politics: yesNo(city => city.hasPolitics, 'Politics active', 'No politics'),
      challenge: yesNo(city => city.hasChallenge, 'Challenge in progress', 'No challenge'),
      formatVersion: tally(saves.map(save => `v${save.formatVersion}`)).sort((a, b) => Number(b.label.slice(1)) - Number(a.label.slice(1))),
    },
    prefs: prefDistributions(saves),
    health: {
      readability: tally(saves.map(save => (save.city.readable ? 'Readable' : `Unreadable: ${save.city.reason}`)), ['Readable']),
      prefsCoverage: [
        count('Preferences in the save', () => saves.filter(save => Object.keys(save.prefs).length > 0).length),
        count('No preferences', () => saves.filter(save => Object.keys(save.prefs).length === 0).length),
      ],
      size: inTranches(saves.map(save => save.size), SIZE_TRANCHES),
      largestSize: saves.reduce((largest, save) => Math.max(largest, save.size), 0),
    },
  }
}
