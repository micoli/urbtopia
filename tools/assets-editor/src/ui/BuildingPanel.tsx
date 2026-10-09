import { useState } from 'react'
import type { BuildingKind, FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { callAssets, fetchCatalog } from '../api'
import { useDirty } from '../hooks/useDirty'
import { useProblems } from '../hooks/useProblems'
import { buildingFieldsOf, isTextField } from '../schema/fields'
import { useDocument, type Doc } from '../store/documentStore'
import { convertBuilding, removeBuilding, setBuilding, toggleRetired } from '../store/edits'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateBuildingDialog } from './CreateBuildingDialog'
import { SchemaForm } from './form/SchemaForm'
import { badge, button, input, panel } from './styles'
import { Tabs } from './Tabs'

const KINDS: readonly BuildingKind[] = ['standard', 'sport', 'nature']

interface Props {
  id: string
}

export function BuildingPanel({ id }: Props) {
  const building = useDocument(state => state.doc.buildings[id]!)
  const savedBefore = useDocument(state => id in state.saved.buildings)
  const { change, setStatus, load, select } = useDocument.getState()
  const problems = useProblems().of('building', id)
  const dirty = useDirty()
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = (next: FlatBuilding) => change(doc => setBuilding(doc, id, next))
  const setField = (key: string, value: unknown) => update({ ...building, [key]: value } as FlatBuilding)
  const fields = buildingFieldsOf(building.kind)
  const modelSlot = (key: string) => ({ dropId: `building:${id}:${key}`, assign: (doc: Doc, modelId: string) => setBuilding(doc, id, { ...doc.buildings[id]!, model: modelId }) })
  const form = (shown: typeof fields) => <SchemaForm fields={shown} value={building} problems={problems} onChange={setField} modelSlot={modelSlot} />
  const textProblems = problems.filter(({ path }) => path.startsWith('name') || path.startsWith('description')).length

  const remove = async () => {
    setDeleting(false)
    if (!savedBefore) return change(doc => removeBuilding(doc, id))
    if (dirty.count) return setStatus('Save or undo your changes before deleting a saved building')
    const error = await callAssets('delete-building', { id })
    if (error) return setStatus(error)
    load(await fetchCatalog())
    select(null)
    setStatus(`${id} deleted`)
  }

  return (
    <article className={`${panel} flex flex-col`}>
      <header className="flex flex-wrap items-start gap-3 border-b border-zinc-200 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{building.name.en || id}</h2>
            {building.retired && <span className={badge('amber')}>retired</span>}
            {dirty.has('building', id) && <span className={badge('amber')}>modified</span>}
            {!savedBefore && <span className={badge('indigo')}>new</span>}
          </div>
          <p className="font-mono text-xs text-zinc-500">{id}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Kind
          <select className={`${input} w-32`} value={building.kind} onChange={event => update(convertBuilding(building, event.target.value as BuildingKind))}>
            {KINDS.map(kind => <option key={kind}>{kind}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button className={button()} onClick={() => setDuplicating(true)}>Duplicate</button>
          <button className={button()} onClick={() => update(toggleRetired(building))} title="A retired building can no longer be built but stays in existing cities">
            {building.retired ? 'Restore' : 'Retire'}
          </button>
          <button className={button('danger')} onClick={() => setDeleting(true)}>Delete</button>
        </div>
      </header>
      <Tabs
        tabs={[
          { id: 'general', label: 'General', badge: problems.length - textProblems, content: form(fields.filter(field => !isTextField(field))) },
          { id: 'description', label: 'Description', badge: textProblems, content: form(fields.filter(isTextField)) },
        ]}
      />
      {duplicating && <CreateBuildingDialog source={id} onClose={() => setDuplicating(false)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${id}?`}
          message={savedBefore ? 'Its file is removed. A building that saves may hold cannot be deleted: retire it instead.' : 'This new building was never saved.'}
          confirm="Delete"
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </article>
  )
}
