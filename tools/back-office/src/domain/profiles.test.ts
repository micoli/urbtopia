import { describe, expect, it } from 'vitest'
import { activeProfile, migrateLegacyConnection, newProfile, parseProfiles, profileProblem, removeProfile, selectProfile, upsertProfile, type Profile, type ProfilesState } from './profiles'

const profile = (id: string, overrides: Partial<Profile> = {}): Profile => ({ ...newProfile(id), name: id, serviceKey: 'key', ...overrides })
const EMPTY: ProfilesState = { profiles: [], activeId: null }

describe('upsertProfile', () => {
  it('adds a profile and makes it active', () => {
    const state = upsertProfile(EMPTY, profile('a', { url: 'http://127.0.0.1:54321/rest/v1/', name: ' Local ' }))
    expect(state.activeId).toBe('a')
    expect(state.profiles[0]).toMatchObject({ url: 'http://127.0.0.1:54321', name: 'Local' })
  })

  it('keeps the active profile when adding another one', () => {
    const state = upsertProfile(upsertProfile(EMPTY, profile('a')), profile('b'))
    expect(state.activeId).toBe('b')
  })

  it('updates an existing profile in place without changing the active one', () => {
    const first = upsertProfile(upsertProfile(EMPTY, profile('a')), profile('b'))
    const state = upsertProfile(selectProfile(first, 'a'), profile('b', { color: 'red' }))
    expect(state.activeId).toBe('a')
    expect(state.profiles.map(item => item.id)).toEqual(['a', 'b'])
    expect(state.profiles[1]?.color).toBe('red')
  })
})

describe('removeProfile', () => {
  const state = upsertProfile(upsertProfile(EMPTY, profile('a')), profile('b'))

  it('falls back to the first profile when the active one is removed', () => {
    expect(removeProfile(state, 'b')).toMatchObject({ activeId: 'a' })
  })

  it('keeps the active profile when another one is removed', () => {
    expect(removeProfile(state, 'a').activeId).toBe('b')
  })

  it('leaves no active profile when the last one is removed', () => {
    expect(removeProfile(removeProfile(state, 'a'), 'b')).toEqual(EMPTY)
  })
})

describe('selectProfile', () => {
  it('ignores an unknown id', () => {
    const state = upsertProfile(EMPTY, profile('a'))
    expect(selectProfile(state, 'zzz')).toBe(state)
    expect(activeProfile(state)?.id).toBe('a')
  })
})

describe('profileProblem', () => {
  it('accepts a complete profile', () => {
    expect(profileProblem(profile('a'))).toBeNull()
  })

  it('names what is missing', () => {
    expect(profileProblem(profile('a', { name: ' ' }))).toMatch(/name/)
    expect(profileProblem(profile('a', { url: 'nope' }))).toMatch(/Supabase URL/)
    expect(profileProblem(profile('a', { serviceKey: '' }))).toMatch(/key/)
    expect(profileProblem(profile('a', { gameUrl: '' }))).toMatch(/game URL/)
  })
})

describe('parseProfiles', () => {
  it('reads what was stored, repairing unknown colors and a dangling active id', () => {
    const raw = JSON.stringify({ profiles: [{ ...profile('a'), color: 'plaid' }, { nope: true }], activeId: 'gone' })
    const state = parseProfiles(raw)
    expect(state.profiles).toHaveLength(1)
    expect(state.profiles[0]?.color).toBe('slate')
    expect(state.activeId).toBe('a')
  })

  it('is empty for missing or broken storage', () => {
    expect(parseProfiles(null)).toEqual(EMPTY)
    expect(parseProfiles('{')).toEqual(EMPTY)
  })
})

describe('migrateLegacyConnection', () => {
  it('turns the single stored connection into a profile', () => {
    const local = migrateLegacyConnection(JSON.stringify({ url: 'http://127.0.0.1:54321', serviceKey: 'k', gameUrl: 'http://localhost:5175' }), 'x')
    expect(local.profiles[0]).toMatchObject({ id: 'x', name: 'Local', color: 'green', gameUrl: 'http://localhost:5175' })
    expect(local.activeId).toBe('x')
    const remote = migrateLegacyConnection(JSON.stringify({ url: 'https://abc.supabase.co', serviceKey: 'k' }), 'y')
    expect(remote.profiles[0]).toMatchObject({ name: 'abc.supabase.co', color: 'red' })
  })

  it('is empty when nothing usable was stored', () => {
    expect(migrateLegacyConnection(null, 'x')).toEqual(EMPTY)
    expect(migrateLegacyConnection('{}', 'x')).toEqual(EMPTY)
  })
})
