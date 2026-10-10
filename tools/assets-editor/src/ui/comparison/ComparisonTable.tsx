import { CellInput } from './CellInput'
import type { ComparableField, Row } from './comparison'

interface Props {
  rows: Row[]
  field: ComparableField
  tierCount: number
  onChange: (id: string, tier: number, value: number) => void
}

export function ComparisonTable({ rows, field, tierCount, onChange }: Props) {
  return (
    <div className="overflow-auto rounded-lg ring-1 ring-zinc-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-zinc-50 text-xs text-zinc-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Game object</th>
            {Array.from({ length: tierCount }, (_, index) => <th key={index} className="px-2 py-2 text-right font-medium">Tier {index + 1}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map(row => (
            <tr key={row.id}>
              <th scope="row" className="px-3 py-1.5 text-left font-medium text-zinc-800">
                {row.name}
                {row.retired && <span className="ml-2 text-xs font-normal text-amber-600">retired</span>}
              </th>
              {Array.from({ length: tierCount }, (_, index) => {
                const cell = row.cells[index]
                if (!cell || (field.key === 'upgradeCost' && index === 0)) return <td key={index} className="px-2 py-1.5 text-right text-zinc-300">—</td>
                return (
                  <td key={index} className="px-2 py-1.5 text-right">
                    <CellInput value={cell.value} inherited={!cell.own} integer={field.integer} label={`${row.name} · Tier ${index + 1} · ${field.label}`} onCommit={value => onChange(row.id, index, value)} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
