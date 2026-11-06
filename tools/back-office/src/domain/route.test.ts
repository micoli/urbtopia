import { describe, expect, it } from 'vitest'
import type { Profile } from './profiles'
import { buildPath, environmentOf, parseRoute, profileForEnvironment } from './route'

const profile = (id: string, url: string): Profile => ({ id, name: id, color: 'slate', url, serviceKey: 'key', gameUrl: 'http://localhost:5173' })

describe('route', () => {
  it('parses environment, view and id', () => {
    expect(parseRoute('/local/bug-report/12')).toEqual({ environment: 'local', view: 'bug-report', id: '12' })
    expect(parseRoute('/production/account/0a1b')).toEqual({ environment: 'production', view: 'account', id: '0a1b' })
  })

  it('falls back on the accounts without environment or id', () => {
    expect(parseRoute('/')).toEqual({ environment: null, view: 'account', id: null })
    expect(parseRoute('/local')).toEqual({ environment: 'local', view: 'account', id: null })
  })

  it('builds a path that parses back', () => {
    const route = { environment: 'production' as const, view: 'bug-report' as const, id: '7' }
    expect(buildPath(route)).toBe('/production/bug-report/7')
    expect(parseRoute(buildPath(route))).toEqual(route)
  })

  it('tells local from production profiles', () => {
    expect(environmentOf(profile('a', 'http://127.0.0.1:54321'))).toBe('local')
    expect(environmentOf(profile('b', 'https://abc.supabase.co'))).toBe('production')
  })

  it('prefers the active profile of the environment', () => {
    const profiles = [profile('a', 'https://a.supabase.co'), profile('b', 'https://b.supabase.co'), profile('c', 'http://localhost:54321')]
    expect(profileForEnvironment(profiles, 'production', 'b')?.id).toBe('b')
    expect(profileForEnvironment(profiles, 'production', 'c')?.id).toBe('a')
    expect(profileForEnvironment(profiles.slice(0, 2), 'local', 'a')).toBeUndefined()
  })
})
