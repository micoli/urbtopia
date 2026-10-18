export interface AccountSummary {
  id: string
  email: string | null
  anonymous: boolean
  createdAt: string
  lastSignInAt: string | null
  bannedUntil: string | null
  handle: string | null
  avatar: string | null
  saveCount: number
}

export type AccountFilter = 'all' | 'email' | 'anonymous' | 'banned'

export const PAGE_SIZE = 25

export function isBanned(account: Pick<AccountSummary, 'bannedUntil'>, now: number): boolean {
  return account.bannedUntil !== null && Date.parse(account.bannedUntil) > now
}

export function filterAccounts(accounts: AccountSummary[], query: string, filter: AccountFilter, now: number): AccountSummary[] {
  const needle = query.trim().toLowerCase()
  return accounts.filter(account => {
    if (filter === 'email' && account.anonymous) return false
    if (filter === 'anonymous' && !account.anonymous) return false
    if (filter === 'banned' && !isBanned(account, now)) return false
    if (needle === '') return true
    return [account.id, account.email, account.handle].some(value => value?.toLowerCase().includes(needle))
  })
}

export function pageOf<T>(items: T[], page: number): T[] {
  return items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}

export function accountLabel(account: Pick<AccountSummary, 'handle' | 'email' | 'id'>): string {
  return account.handle ?? account.email ?? account.id.slice(0, 8)
}
