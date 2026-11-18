import { describe, expect, it } from 'vitest'
import { buildPrefsTable, formatPrefValue, prefsOfSave, sortPrefsRows, type LatestSavedPrefs } from './savedPrefsTable'

const save = (userId: string, prefs: unknown): LatestSavedPrefs => ({ userId, revision: 1, savedAt: '2026-11-18T10:00:00Z', prefs })
const label = (userId: string) => userId.toUpperCase()

describe('prefsOfSave', () => {
  it.each([[null], [undefined], [[1]], ['dark'], [3]])('reads %j as no preferences', (value) => {
    expect(prefsOfSave(value)).toEqual({})
  })

  it('keeps every key and value of the save', () => {
    const prefs = { language: 'fr', futureKey: { nested: [1, null] }, broken: 'maybe' }
    expect(prefsOfSave(prefs)).toEqual(prefs)
  })
})

describe('buildPrefsTable', () => {
  it('has one column per key found in the saves, not per key the game knows', () => {
    const table = buildPrefsTable([save('a', { language: 'fr', zzFuture: 1 }), save('b', { language: 'en' }), save('c', undefined)], label)
    expect(table.columns).toEqual([{ key: 'language', users: 2 }, { key: 'zzFuture', users: 1 }])
  })

  it('keeps a user whose save has no preferences', () => {
    const table = buildPrefsTable([save('a', null)], label)
    expect(table.rows).toEqual([{ userId: 'a', label: 'A', savedAt: '2026-11-18T10:00:00Z', prefs: {} }])
  })
})

describe('formatPrefValue', () => {
  it('shows strings as they are and everything else as JSON', () => {
    expect(formatPrefValue('fr')).toBe('fr')
    expect(formatPrefValue(false)).toBe('false')
    expect(formatPrefValue(null)).toBe('null')
    expect(formatPrefValue(['a', 1])).toBe('["a",1]')
  })
})

describe('sortPrefsRows', () => {
  const rows = buildPrefsTable([save('b', { speed: 10 }), save('a', { speed: 2 }), save('c', {}), save('d', { speed: 4 })], label).rows

  it('sorts by date of the save without a column, the label settling ties', () => {
    const dated = [{ ...rows[0]!, savedAt: '2026-11-01T10:00:00Z' }, { ...rows[1]!, savedAt: '2026-11-03T10:00:00Z' }, { ...rows[2]!, savedAt: '2026-11-03T10:00:00Z' }, { ...rows[3]!, savedAt: '2026-11-02T10:00:00Z' }]
    expect(sortPrefsRows(dated, null, 'desc').map(row => row.userId)).toEqual(['a', 'c', 'd', 'b'])
    expect(sortPrefsRows(dated, null, 'asc').map(row => row.userId)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('sorts numbers by value and puts the users without the key last in both directions', () => {
    expect(sortPrefsRows(rows, 'speed', 'asc').map(row => row.userId)).toEqual(['a', 'd', 'b', 'c'])
    expect(sortPrefsRows(rows, 'speed', 'desc').map(row => row.userId)).toEqual(['b', 'd', 'a', 'c'])
  })
})
