export interface LatestSavedPrefs {
  userId: string
  revision: number
  savedAt: string
  prefs: unknown
}

export interface PrefsRow {
  userId: string
  label: string
  savedAt: string
  prefs: Record<string, unknown>
}

export interface PrefsColumn {
  key: string
  users: number
}

export interface PrefsTable {
  columns: PrefsColumn[]
  rows: PrefsRow[]
}

export type SortDirection = 'asc' | 'desc'

// Read as the save holds it: a save without preferences, or with unreadable ones, has none.
export function prefsOfSave(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function formatPrefValue(value: unknown): string {
  return typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value))
}

export function buildPrefsTable(saves: readonly LatestSavedPrefs[], labelOf: (userId: string) => string): PrefsTable {
  const rows = saves.map((save): PrefsRow => ({ userId: save.userId, label: labelOf(save.userId), savedAt: save.savedAt, prefs: prefsOfSave(save.prefs) }))
  const counts = new Map<string, number>()
  for (const row of rows) for (const key of Object.keys(row.prefs)) counts.set(key, (counts.get(key) ?? 0) + 1)
  const columns = [...counts].map(([key, users]) => ({ key, users })).sort((a, b) => a.key.localeCompare(b.key))
  return { columns, rows }
}

// Without a key, sorted by date of the save. With one, sorted by what a cell shows; a user whose save lacks the preference goes last in either direction.
export function sortPrefsRows(rows: readonly PrefsRow[], key: string | null, direction: SortDirection): PrefsRow[] {
  const byLabel = (a: PrefsRow, b: PrefsRow) => a.label.localeCompare(b.label)
  const sign = direction === 'asc' ? 1 : -1
  if (key === null) return [...rows].sort((a, b) => sign * (Date.parse(a.savedAt) - Date.parse(b.savedAt)) || byLabel(a, b))
  return [...rows].sort((a, b) => {
    const aHas = Object.hasOwn(a.prefs, key)
    const bHas = Object.hasOwn(b.prefs, key)
    if (aHas !== bHas) return aHas ? -1 : 1
    if (!aHas) return byLabel(a, b)
    const order = formatPrefValue(a.prefs[key]).localeCompare(formatPrefValue(b.prefs[key]), undefined, { numeric: true })
    return order === 0 ? byLabel(a, b) : sign * order
  })
}
