import { useState } from 'react'
import type { BuildingKind } from '../../../../../src/core/buildings/buildingDefinition'
import { useDocument } from '../../store/documentStore'
import { setDefinition } from '../../store/edits'
import { input, panel } from '../styles'
import { ComparisonCurve } from './ComparisonCurve'
import { ComparisonTable } from './ComparisonTable'
import { COMPARABLE_KINDS, comparableFieldsOf, rowsOf, withCell } from './comparison'

// Every Game object of a kind side by side, one value per Tier: edited here or in its form, saved and validated the same way.
export function ComparisonView() {
  const definitions = useDocument(state => state.doc.collections.buildings)
  const [kind, setKind] = useState<BuildingKind>('home')
  const [fieldKey, setFieldKey] = useState('')
  const fields = comparableFieldsOf(kind)
  const field = fields.find(candidate => candidate.key === fieldKey) ?? fields[0]!
  const rows = rowsOf(definitions, kind, field.key)
  const tierCount = Math.max(0, ...rows.map(row => row.cells.length))

  const edit = (id: string, tier: number, value: number) => useDocument.getState().change(doc => setDefinition(doc, 'buildings', id, withCell(doc.collections.buildings[id]!, field.key, tier, value)))

  return (
    <section className={`${panel} flex flex-col gap-4 p-4`}>
      <header className="flex flex-wrap items-end gap-3">
        <h2 className="mr-auto text-lg font-semibold">Compare</h2>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Kind
          <select className={`${input} w-40`} value={kind} onChange={event => { setKind(event.target.value as BuildingKind); setFieldKey('') }}>
            {COMPARABLE_KINDS.map(candidate => <option key={candidate}>{candidate}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Value
          <select className={`${input} w-48`} value={field.key} onChange={event => setFieldKey(event.target.value)}>
            {fields.map(candidate => <option key={candidate.key} value={candidate.key}>{candidate.label}</option>)}
          </select>
        </label>
      </header>
      {rows.length ? (
        <>
          <ComparisonTable rows={rows} field={field} tierCount={tierCount} onChange={edit} />
          <ComparisonCurve rows={rows} tierCount={tierCount} />
          <p className="text-xs text-zinc-500">Greyed values are inherited from the previous Tier; typing one sets it on that Tier.</p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">No {kind} Game object yet.</p>
      )}
    </section>
  )
}
