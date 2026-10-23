import { describe, expect, it } from 'vitest'
import { sortAccounts } from './accountSort'
import type { AccountSummary } from './accounts'
import type { SaveStats } from './saveStats'

const account = (id: string, overrides: Partial<AccountSummary> = {}): AccountSummary => ({
  id,
  email: null,
  anonymous: true,
  createdAt: '2026-10-01T00:00:00Z',
  lastSignInAt: null,
  bannedUntil: null,
  handle: null,
  avatar: null,
  saveCount: 0,
  ...overrides,
})

const stats = (citizens: number, urbs: number): SaveStats => ({ readable: true, citizens, urbs, buildings: 0, parcels: 0, lastSeen: 0, savedAt: 0 })

const a = account('a', { lastSignInAt: '2026-10-05T00:00:00Z' })
const b = account('b')
const c = account('c', { lastSignInAt: '2026-10-06T00:00:00Z' })
const ids = (accounts: AccountSummary[]) => accounts.map(item => item.id)
const none = new Map<string, SaveStats>()

describe('sortAccounts', () => {
  it('keeps the order without a key', () => {
    expect(ids(sortAccounts([a, b, c], null, 'desc', none))).toEqual(['a', 'b', 'c'])
  })

  it('puts accounts without a value last, whatever the direction', () => {
    expect(ids(sortAccounts([a, b, c], 'lastSignIn', 'desc', none))).toEqual(['c', 'a', 'b'])
    expect(ids(sortAccounts([a, b, c], 'lastSignIn', 'asc', none))).toEqual(['a', 'c', 'b'])
  })

  it('sorts by save stats and puts unknown or unreadable saves last', () => {
    const known = new Map<string, SaveStats>([['a', stats(10, 500)], ['b', stats(300, 20)], ['c', { readable: false, reason: 'invalid-json' }]])
    expect(ids(sortAccounts([a, b, c], 'citizens', 'desc', known))).toEqual(['b', 'a', 'c'])
    expect(ids(sortAccounts([a, b, c], 'urbs', 'asc', known))).toEqual(['b', 'a', 'c'])
  })
})
