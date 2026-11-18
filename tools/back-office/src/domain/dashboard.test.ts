import { describe, expect, it } from 'vitest'
import { buildDashboard, crossTab, spreadOf } from './dashboard'
import type { CityFacts, SaveFacts } from './saveFacts'

const NOW = Date.parse('2026-11-19T12:00:00Z')
const DAY = 86_400_000

const city = (patch: Partial<CityFacts> = {}): CityFacts => ({ content: { buildingTypes: {}, features: {} }, citizens: 50, urbs: 100, buildings: 10, parcels: 4, difficulty: 'cozy', tutorialStep: null, hasPolitics: false, hasChallenge: false, ...patch })

const save = (userId: string, patch: Partial<SaveFacts> & { facts?: Partial<CityFacts> } = {}): SaveFacts => {
  const { facts, ...rest } = patch
  return { userId, cityId: 'c1', cityIds: ['c1'], formatVersion: 19, savedAt: new Date(NOW - DAY).toISOString(), size: 1000, prefs: {}, city: { readable: true, facts: city(facts) }, ...rest }
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
  it('crosses the language of the preferences with the difficulty, in the order of the difficulties', () => {
    const dashboard = buildDashboard([
      save('a', { prefs: { language: 'fr' }, facts: { difficulty: 'hard' } }),
      save('b', { prefs: { language: 'fr' }, facts: { difficulty: 'cozy' } }),
      save('x', { prefs: { language: 'en' }, facts: { difficulty: 'cozy' } }),
      save('y', { facts: { difficulty: 'cozy' } }),
      save('z', { prefs: { language: 'en' }, city: { readable: false, reason: 'invalid-state' } }),
    ], accounts, NOW)
    expect(dashboard.crossings[0]!.table).toEqual({ rows: ['fr', '— not in the save', 'en'], columns: ['cozy', 'hard'], cells: [[1, 1], [1, 0], [1, 0]], largest: 1 })
  })
})

describe('crossTab', () => {
  it('counts each pair and orders the rows by frequency', () => {
    const table = crossTab([{ row: 'b', column: 'x' }, { row: 'a', column: 'y' }, { row: 'a', column: 'y' }, { row: 'a', column: 'x' }], ['y', 'x'])
    expect(table).toEqual({ rows: ['a', 'b'], columns: ['y', 'x'], cells: [[2, 1], [0, 1]], largest: 2 })
  })

  it('has nothing without pairs', () => {
    expect(crossTab([])).toEqual({ rows: [], columns: [], cells: [], largest: 0 })
  })
})

describe('content of the cities', () => {
  const withContent = (userId: string, cityId: string, buildingTypes: Record<string, number>, features: Record<string, boolean> = {}) =>
    save(userId, { cityId, facts: { content: { buildingTypes, features } } })

  it('counts the cities holding each building type, not the buildings', () => {
    const { content } = buildDashboard([], accounts, NOW, [withContent('a', 'c1', { workshop: 5, factory: 1 }), withContent('a', 'c2', { workshop: 2 }), withContent('b', 'c1', {})])
    expect(content.cities).toBe(3)
    expect(content.topTypes).toEqual([{ label: 'workshop', count: 2 }, { label: 'factory', count: 1 }])
  })

  it('counts the cities with at least one building of each kind', () => {
    const { content } = buildDashboard([], accounts, NOW, [withContent('a', 'c1', { workshop: 1, factory: 1 }), withContent('b', 'c1', { workshop: 3 })])
    expect(content.byKind[0]).toEqual({ label: 'production', count: 2 })
  })

  it('lists the buildings of the catalog that no city has', () => {
    const { content } = buildDashboard([], accounts, NOW, [withContent('a', 'c1', { workshop: 1 })])
    const all = content.unbuilt.flatMap(entry => entry.ids)
    expect(all).not.toContain('workshop')
    expect(all.length).toBeGreaterThan(0)
    expect(content.unbuilt.every(entry => entry.ids.length <= entry.total)).toBe(true)
  })

  it('does not call the whole catalog unbuilt when there is no city to look at', () => {
    expect(buildDashboard([], accounts, NOW, []).content.unbuilt).toEqual([])
    expect(buildDashboard([], accounts, NOW, [save('a', { city: { readable: false, reason: 'invalid-json' } })]).content.unbuilt).toEqual([])
  })

  it('counts the cities with each feature, by group', () => {
    const { content } = buildDashboard([], accounts, NOW, [withContent('a', 'c1', {}, { rails: true, market: true }), withContent('b', 'c1', {}, { rails: true })])
    expect(content.features.find(group => group.group === 'Transport')?.items.find(item => item.label === 'Rails')?.count).toBe(2)
    expect(content.features.find(group => group.group === 'Economy and land')?.items.find(item => item.label === 'Market unlocked')?.count).toBe(1)
  })

  it('reads the cities of the period separately from the latest save of each user', () => {
    const dashboard = buildDashboard([withContent('a', 'c1', { workshop: 1 })], accounts, NOW, [withContent('a', 'c1', { workshop: 1 }), withContent('a', 'c2', { factory: 1 })])
    expect(dashboard.users).toBe(1)
    expect(dashboard.content.cities).toBe(2)
  })
})
