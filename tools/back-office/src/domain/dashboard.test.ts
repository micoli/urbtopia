import { describe, expect, it } from 'vitest'
import { buildDashboard, spreadOf } from './dashboard'
import type { CityFacts, SaveFacts } from './saveFacts'

const NOW = Date.parse('2026-11-19T12:00:00Z')
const DAY = 86_400_000

const city = (patch: Partial<CityFacts> = {}): CityFacts => ({ citizens: 50, urbs: 100, buildings: 10, parcels: 4, difficulty: 'cozy', tutorialStep: null, hasPolitics: false, hasChallenge: false, ...patch })

const save = (userId: string, patch: Partial<SaveFacts> & { facts?: Partial<CityFacts> } = {}): SaveFacts => {
  const { facts, ...rest } = patch
  return { userId, cityIds: ['c1'], formatVersion: 19, savedAt: new Date(NOW - DAY).toISOString(), size: 1000, prefs: {}, city: { readable: true, facts: city(facts) }, ...rest }
}

const accounts = new Map([['a', { anonymous: false }], ['b', { anonymous: true }]])

describe('spreadOf', () => {
  it('gives nothing for no value', () => {
    expect(spreadOf([])).toBeNull()
  })

  it('gives the 50th, 75th, 90th and 95th percentiles by nearest rank', () => {
    expect(spreadOf([5, 1, 3, 2, 4, 6, 7, 8, 9, 10])).toEqual({ p50: 5, p75: 8, p90: 9, p95: 10 })
    expect(spreadOf([7])).toEqual({ p50: 7, p75: 7, p90: 7, p95: 7 })
  })
})

describe('buildDashboard', () => {
  it('counts the users, the account kinds and the recency of the latest saves', () => {
    const dashboard = buildDashboard([
      save('a'),
      save('b', { savedAt: new Date(NOW - 20 * DAY).toISOString() }),
      save('x', { savedAt: new Date(NOW - 90 * DAY).toISOString() }),
    ], accounts, NOW)
    expect(dashboard.users).toBe(3)
    expect(dashboard.activity.accountKind).toEqual([{ label: 'Email', count: 1 }, { label: 'Anonymous', count: 1 }, { label: 'Unknown account', count: 1 }])
    expect(dashboard.activity.recency.map(bucket => bucket.count)).toEqual([1, 1, 1])
  })

  it('counts the cities of each user', () => {
    const dashboard = buildDashboard([save('a'), save('b', { cityIds: ['c1', 'c2'] }), save('x', { cityIds: ['c1', 'c2'] })], accounts, NOW)
    expect(dashboard.activity.cities).toEqual([{ label: '1 city', count: 1 }, { label: '2 cities', count: 2 }])
  })

  it('leaves unreadable saves out of the city figures and reports them in the health block', () => {
    const dashboard = buildDashboard([save('a', { facts: { citizens: 500 } }), save('b', { city: { readable: false, reason: 'newer-version' } })], accounts, NOW)
    expect(dashboard.readable).toBe(1)
    expect(dashboard.progression.spreads[0]).toEqual({ label: 'Citizens', spread: { p50: 500, p75: 500, p90: 500, p95: 500 } })
    expect(dashboard.health.readability).toEqual([{ label: 'Readable', count: 1 }, { label: 'Unreadable: newer-version', count: 1 }])
  })

  it('orders the Tutorial steps as the game does and ends with the players who are past it', () => {
    const dashboard = buildDashboard([save('a', { facts: { tutorialStep: null } }), save('b', { facts: { tutorialStep: 'factory' } }), save('x', { facts: { tutorialStep: 'road' } })], accounts, NOW)
    expect(dashboard.progression.tutorial.map(bucket => bucket.label)).toEqual(['road', 'factory', 'over'])
  })

  it('counts the Difficulties, politics and Challenges of the readable cities', () => {
    const dashboard = buildDashboard([save('a', { facts: { difficulty: 'hard', hasPolitics: true } }), save('b'), save('x', { facts: { hasChallenge: true } })], accounts, NOW)
    expect(dashboard.settings.difficulty).toEqual([{ label: 'cozy', count: 2 }, { label: 'hard', count: 1 }])
    expect(dashboard.settings.politics).toEqual([{ label: 'Politics active', count: 1 }, { label: 'No politics', count: 2 }])
    expect(dashboard.settings.challenge).toEqual([{ label: 'Challenge in progress', count: 1 }, { label: 'No challenge', count: 2 }])
  })

  it('puts the newest save format version first', () => {
    const dashboard = buildDashboard([save('a', { formatVersion: 9 }), save('b', { formatVersion: 19 }), save('x', { formatVersion: 19 })], accounts, NOW)
    expect(dashboard.settings.formatVersion).toEqual([{ label: 'v19', count: 2 }, { label: 'v9', count: 1 }])
  })

  it('shows each preference as the saves hold it, unknown keys and odd values included', () => {
    const dashboard = buildDashboard([
      save('a', { prefs: { language: 'fr', futureKey: { nested: [1] } } }),
      save('b', { prefs: { language: 'fr', traffic: 'maybe' } }),
      save('x', {}),
    ], accounts, NOW)
    expect(dashboard.prefs.map(pref => pref.key)).toEqual(['futureKey', 'language', 'traffic'])
    expect(dashboard.prefs.find(pref => pref.key === 'language')?.values).toEqual([{ label: 'fr', count: 2 }, { label: '— not in the save', count: 1 }])
    expect(dashboard.prefs.find(pref => pref.key === 'futureKey')?.values[0]).toEqual({ label: '— not in the save', count: 2 })
    expect(dashboard.prefs.find(pref => pref.key === 'traffic')?.values.map(bucket => bucket.label)).toContain('maybe')
  })

  it('groups the rarest values of a preference after the eight most frequent', () => {
    const saves = Array.from({ length: 12 }, (_, index) => save(`u${index}`, { prefs: { debugOffsetX: index } }))
    const values = buildDashboard(saves, accounts, NOW).prefs[0]!.values
    expect(values).toHaveLength(9)
    expect(values[8]).toEqual({ label: 'other values', count: 4 })
  })

  it('measures the preferences coverage and the size of the saves', () => {
    const dashboard = buildDashboard([save('a', { prefs: { language: 'en' }, size: 100 }), save('b', { size: 900_000 })], accounts, NOW)
    expect(dashboard.health.prefsCoverage).toEqual([{ label: 'Preferences in the save', count: 1 }, { label: 'No preferences', count: 1 }])
    expect(dashboard.health.size.map(bucket => bucket.count)).toEqual([1, 0, 0, 1])
    expect(dashboard.health.largestSize).toBe(900_000)
  })

  it('has nothing to show without saves', () => {
    const dashboard = buildDashboard([], accounts, NOW)
    expect(dashboard.users).toBe(0)
    expect(dashboard.prefs).toEqual([])
    expect(dashboard.progression.spreads.every(row => row.spread === null)).toBe(true)
  })
})
