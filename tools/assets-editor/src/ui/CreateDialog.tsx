import { Dialog } from 'radix-ui'
import { useState } from 'react'
import type { BuildingKind } from '../../../../src/core/buildings/buildingDefinition'
import { BUILDING_KINDS } from '../../../../src/core/buildings/buildingSchema'
import { specOf, type CollectionName, type Definition } from '../../../../scripts/collections'
import { useDocument } from '../store/documentStore'
import { blankBuilding, blankDefinition, insertDefinitionAfter } from '../store/edits'
import { button, dialogContent, dialogOverlay, input } from './styles'


interface Props {
  collection: CollectionName
  source?: string
  onClose: () => void
}

// The id is chosen once: it lives in saves, so the editor never renames it afterwards.
export function CreateDialog({ collection, source, onClose }: Props) {
  const definitions = useDocument(state => state.doc.collections[collection])
  const models = useDocument(state => state.doc.models)
  const selection = useDocument(state => state.selection)
  const [id, setId] = useState(source ? `${source}${collection === 'buildings' ? '-copy' : 'Copy'}` : '')
  const [kind, setKind] = useState<BuildingKind>('standard')
  const spec = specOf(collection)

  const taken = Object.keys(definitions).some(existing => existing.toLowerCase() === id.toLowerCase())
  const error = !id ? '' : !spec.idPattern.test(id) ? `The id must ${spec.idRule}` : taken ? 'This id is already used' : ''
  const defaultModel = selection?.kind === 'models' ? selection.id : (Object.keys(models)[0] ?? '')

  const create = () => {
    if (!id || error) return
    const blank = collection === 'buildings' ? (blankBuilding(kind, defaultModel) as unknown as Definition) : blankDefinition(collection, defaultModel)
    const definition = source ? structuredClone(definitions[source]!) : blank
    const { change, select } = useDocument.getState()
    change(doc => insertDefinitionAfter(doc, collection, source ?? (selection?.kind === collection ? selection.id : undefined), id, definition))
    select({ kind: collection, id })
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">{source ? `Duplicate ${source}` : `New ${spec.title.replace(/s$/, '').toLowerCase()}`}</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">The id cannot change once saved: saves refer to it.</Dialog.Description>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Id
            <input className={input} autoFocus value={id} onChange={event => setId(event.target.value.trim())} onKeyDown={event => event.key === 'Enter' && create()} />
            {error && <span className="text-xs text-red-600">{error}</span>}
          </label>
          {collection === 'buildings' && !source && (
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Kind
              <select className={input} value={kind} onChange={event => setKind(event.target.value as BuildingKind)}>
                {BUILDING_KINDS.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onClose}>Cancel</button>
            <button className={button('primary')} disabled={!id || !!error} onClick={create}>{source ? 'Duplicate' : 'Create'}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
