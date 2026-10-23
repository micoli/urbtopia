import type { AccountSummary } from './accounts'
import type { SaveStats } from './saveStats'

export type AccountSortKey = 'lastSignIn' | 'citizens' | 'urbs'
export type SortDirection = 'asc' | 'desc'

export const SORT_OPTIONS: { key: AccountSortKey; label: string; defaultDirection: SortDirection }[] = [
  { key: 'lastSignIn', label: 'Last access', defaultDirection: 'desc' },
  { key: 'citizens', label: 'Citizens', defaultDirection: 'desc' },
  { key: 'urbs', label: 'Urbs', defaultDirection: 'desc' },
]

export function sortNeedsStats(key: AccountSortKey | null): boolean {
  return key === 'citizens' || key === 'urbs'
}

function valueOf(account: AccountSummary, key: AccountSortKey, stats: ReadonlyMap<string, SaveStats>): number | null {
  if (key === 'lastSignIn') return account.lastSignInAt === null ? null : Date.parse(account.lastSignInAt)
  const known = stats.get(account.id)
  if (!known?.readable) return null
  return key === 'citizens' ? known.citizens : known.urbs
}

export function sortAccounts(accounts: AccountSummary[], key: AccountSortKey | null, direction: SortDirection, stats: ReadonlyMap<string, SaveStats>): AccountSummary[] {
  if (key === null) return accounts
  const sign = direction === 'asc' ? 1 : -1
  const keyed = accounts.map(account => ({ account, value: valueOf(account, key, stats) }))
  keyed.sort((a, b) => {
    if (a.value === null || b.value === null) return a.value === b.value ? 0 : a.value === null ? 1 : -1
    return (a.value - b.value) * sign
  })
  return keyed.map(({ account }) => account)
}
