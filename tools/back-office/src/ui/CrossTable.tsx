import type { CrossTable as CrossTableData } from '../domain/dashboard'
import { formatNumber } from '../domain/format'

interface Props {
  table: CrossTableData
}

// A heatmap of counts: one hue, the darker the cell the more users.
export function CrossTable({ table }: Props) {
  if (table.rows.length === 0) return <p className="text-xs text-zinc-500">Nothing to cross yet.</p>
  return (
    <table className="w-full border-separate border-spacing-0.5 text-xs">
      <thead>
        <tr>
          <th />
          {table.columns.map(column => <th key={column} className="px-2 py-1 text-center font-medium text-zinc-600">{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={row}>
            <th className="whitespace-nowrap pr-2 text-left font-medium text-zinc-700">{row}</th>
            {table.columns.map((column, columnIndex) => {
              const value = table.cells[rowIndex]![columnIndex]!
              return (
                <td key={column} title={`${row} · ${column}: ${formatNumber(value)}`} className="rounded px-2 py-1.5 text-center tabular-nums text-zinc-900" style={{ background: value === 0 ? 'var(--series-track)' : `color-mix(in oklab, var(--series-1) ${Math.round(20 + (value / table.largest) * 60)}%, transparent)` }}>
                  {value === 0 ? <span className="text-zinc-400">0</span> : formatNumber(value)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
