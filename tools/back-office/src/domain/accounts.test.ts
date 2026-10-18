import { describe, expect, it } from 'vitest'
import { accountLabel, filterAccounts, isBanned, pageCount, pageOf, PAGE_SIZE, type AccountSummary } from './accounts'

const NOW = Date.parse('2026-10-18T12:00:00Z')

const account = (overrides: Partial<AccountSummary>): AccountSummary => ({
  id: '11111111-2222-3333-4444-555555555555',
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

const ada = account({ id: 'a', email: 'ada@example.com', anonymous: false, handle: 'Ada' })
const bob = account({ id: 'b', bannedUntil: '2126-01-01T00:00:00Z' })
const old = account({ id: 'c', bannedUntil: '2020-01-01T00:00:00Z' })

describe('isBanned', () => {
  it('is on only while the ban lasts', () => {
    expect(isBanned(bob, NOW)).toBe(true)
    expect(isBanned(old, NOW)).toBe(false)
    expect(isBanned(ada, NOW)).toBe(false)
  })
})

describe('filterAccounts', () => {
  const all = [ada, bob, old]

  it('filters by kind', () => {
    expect(filterAccounts(all, '', 'email', NOW)).toEqual([ada])
    expect(filterAccounts(all, '', 'anonymous', NOW)).toEqual([bob, old])
    expect(filterAccounts(all, '', 'banned', NOW)).toEqual([bob])
  })

  it('searches id, email and handle without case', () => {
    expect(filterAccounts(all, 'ADA', 'all', NOW)).toEqual([ada])
    expect(filterAccounts(all, 'example.com', 'all', NOW)).toEqual([ada])
    expect(filterAccounts(all, 'b', 'all', NOW)).toEqual([bob])
    expect(filterAccounts(all, 'nobody', 'all', NOW)).toEqual([])
  })
})

describe('pages', () => {
  it('cuts items in pages of PAGE_SIZE', () => {
    const items = Array.from({ length: PAGE_SIZE + 3 }, (_, index) => index)
    expect(pageOf(items, 0)).toHaveLength(PAGE_SIZE)
    expect(pageOf(items, 1)).toEqual([PAGE_SIZE, PAGE_SIZE + 1, PAGE_SIZE + 2])
    expect(pageCount(items.length)).toBe(2)
    expect(pageCount(0)).toBe(1)
  })
})

describe('accountLabel', () => {
  it('prefers the handle, then the email, then the short id', () => {
    expect(accountLabel(ada)).toBe('Ada')
    expect(accountLabel({ ...ada, handle: null })).toBe('ada@example.com')
    expect(accountLabel(account({}))).toBe('11111111')
  })
})
