import { formatDate } from '../domain/format'
import { formatPrefValue, sortPrefsRows, type PrefsTable as PrefsTableData, type SortDirection } from '../domain/savedPrefsTable'

export interface PrefsSort {
  key: string | null
  direction: SortDirection
}

interface Props {
  table: PrefsTableData
  sort: PrefsSort
  onSort: (key: string | null) => void
  onOpenAccount: (userId: string) => void
}

export function PrefsTable({ table, sort, onSort, onOpenAccount }: Props) {
  const rows = sortPrefsRows(table.rows, sort.key, sort.direction)
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-white ring-1 ring-zinc-200">
      <table className="w-max min-w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-zinc-100">
          <tr>
            <th className="sticky left-0 bg-zinc-100 px-3 py-2 font-medium text-zinc-600">User</th>
            <th aria-sort={sort.key === null ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-3 py-2 font-medium text-zinc-600">
              <button className="flex items-baseline gap-1 whitespace-nowrap hover:text-zinc-900" onClick={() => onSort(null)}>
                Saved
                {sort.key === null && <span>{sort.direction === 'asc' ? '↑' : '↓'}</span>}
              </button>
            </th>
            {table.columns.map(column => (
              <th key={column.key} aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-3 py-2 font-medium text-zinc-600">
                <button className="flex items-baseline gap-1 whitespace-nowrap hover:text-zinc-900" onClick={() => onSort(column.key)}>
                  {column.key}
                  <span className="font-normal text-zinc-400">{column.users}</span>
                  {sort.key === column.key && <span>{sort.direction === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.userId} className="border-t border-zinc-100 hover:bg-zinc-50">
              <th className="sticky left-0 bg-white px-3 py-1.5 font-medium">
                <button className="max-w-56 truncate text-indigo-700 hover:underline" onClick={() => onOpenAccount(row.userId)}>{row.label}</button>
              </th>
              <td className="whitespace-nowrap px-3 py-1.5 text-zinc-500">{formatDate(row.savedAt)}</td>
              {table.columns.map(column => (
                <td key={column.key} className="max-w-48 truncate px-3 py-1.5 font-mono" title={Object.hasOwn(row.prefs, column.key) ? formatPrefValue(row.prefs[column.key]) : undefined}>
                  {Object.hasOwn(row.prefs, column.key) ? formatPrefValue(row.prefs[column.key]) : <span className="text-zinc-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
