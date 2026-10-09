import { useState } from 'react'
import type { BuildingKind, FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { specOf, type CollectionName, type Definition } from '../../../../scripts/collections'
import { callAssets, fetchCatalog } from '../api'
import { useDirty } from '../hooks/useDirty'
import { useProblems } from '../hooks/useProblems'
import { collectionFieldsOf, isTextField } from '../schema/fields'
import { useDocument, type Doc } from '../store/documentStore'
import { convertBuilding, removeDefinition, setDefinition, setIn, toggleRetired } from '../store/edits'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateDialog } from './CreateDialog'
import type { FieldPath } from './form/FieldControl'
import { SchemaForm } from './form/SchemaForm'
import { badge, button, input, panel } from './styles'
import { Tabs } from './Tabs'

const BUILDING_KINDS: readonly BuildingKind[] = ['standard', 'sport', 'nature']

interface Props {
  collection: CollectionName
  id: string
}

export function DefinitionPanel({ collection, id }: Props) {
  const definition = useDocument(state => state.doc.collections[collection][id]!)
  const savedBefore = useDocument(state => id in state.saved.collections[collection])
  const { change, setStatus, load, select } = useDocument.getState()
  const problems = useProblems().of(collection, id)
  const dirty = useDirty()
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const update = (next: Definition) => change(doc => setDefinition(doc, collection, id, next))
  const setField = (key: string, value: unknown) => update(setIn(definition, [key], value) as Definition)
  const fields = collectionFieldsOf(collection, definition)
  const modelSlot = (path: FieldPath) => ({
    dropId: `${collection}:${id}:${path.join('.')}`,
    assign: (doc: Doc, modelId: string) => setDefinition(doc, collection, id, setIn(doc.collections[collection][id], path, modelId) as Definition),
  })
  const form = (shown: typeof fields) => <SchemaForm fields={shown} value={definition} problems={problems} onChange={setField} modelSlot={modelSlot} />
  const textProblems = problems.filter(({ path }) => path.startsWith('name') || path.startsWith('description')).length
  const name = (definition.name as { en?: string } | undefined)?.en
  const retirable = collection === 'buildings'

  const remove = async () => {
    setDeleting(false)
    if (!savedBefore) return change(doc => removeDefinition(doc, collection, id))
    if (dirty.count) return setStatus('Save or undo your changes before deleting a saved Game object')
    const error = await callAssets('delete-definition', { collection, id })
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
            <h2 className="truncate text-lg font-semibold">{name || id}</h2>
            <span className={badge()}>{specOf(collection).title.replace(/s$/, '')}</span>
            {definition.retired === true && <span className={badge('amber')}>retired</span>}
            {dirty.has(collection, id) && <span className={badge('amber')}>modified</span>}
            {!savedBefore && <span className={badge('indigo')}>new</span>}
          </div>
          <p className="font-mono text-xs text-zinc-500">{id}</p>
        </div>
        {collection === 'buildings' && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Kind
            <select className={`${input} w-32`} value={definition.kind as string} onChange={event => update(convertBuilding(definition as unknown as FlatBuilding, event.target.value as BuildingKind) as unknown as Definition)}>
              {BUILDING_KINDS.map(kind => <option key={kind}>{kind}</option>)}
            </select>
          </label>
        )}
        <div className="flex gap-2">
          <button className={button()} onClick={() => setDuplicating(true)}>Duplicate</button>
          {retirable && (
            <button className={button()} onClick={() => update(toggleRetired(definition))} title="A retired Game object can no longer be built but stays in existing cities">
              {definition.retired ? 'Restore' : 'Retire'}
            </button>
          )}
          <button className={button('danger')} onClick={() => setDeleting(true)}>Delete</button>
        </div>
      </header>
      <Tabs
        tabs={[
          { id: 'general', label: 'General', badge: problems.length - textProblems, content: form(fields.filter(field => !isTextField(field))) },
          { id: 'description', label: 'Description', badge: textProblems, content: form(fields.filter(isTextField)) },
        ]}
      />
      {duplicating && <CreateDialog collection={collection} source={id} onClose={() => setDuplicating(false)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${id}?`}
          message={savedBefore ? 'Its file is removed. An id that saves may hold cannot be deleted: retire it instead.' : 'This new Game object was never saved.'}
          confirm="Delete"
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </article>
  )
}
