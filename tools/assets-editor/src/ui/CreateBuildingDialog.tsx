import { Dialog } from 'radix-ui'
import { useState } from 'react'
import type { BuildingKind } from '../../../../src/core/buildings/buildingDefinition'
import { BUILDING_ID_PATTERN } from '../../../../src/core/buildings/buildingSchema'
import { useDocument } from '../store/documentStore'
import { blankBuilding, insertBuildingAfter } from '../store/edits'
import { button, dialogContent, dialogOverlay, input } from './styles'

const KINDS: readonly BuildingKind[] = ['standard', 'sport', 'nature']

interface Props {
  source?: string
  onClose: () => void
}

// The id is chosen once: it lives in saves, so the editor never renames it afterwards.
export function CreateBuildingDialog({ source, onClose }: Props) {
  const buildings = useDocument(state => state.doc.buildings)
  const models = useDocument(state => state.doc.models)
  const selection = useDocument(state => state.selection)
  const original = source ? buildings[source] : undefined
  const [id, setId] = useState(source ? `${source}-copy` : '')
  const [kind, setKind] = useState<BuildingKind>('standard')

  const taken = Object.keys(buildings).some(existing => existing.toLowerCase() === id.toLowerCase())
  const error = !id ? '' : !BUILDING_ID_PATTERN.test(id) ? 'Start with a lowercase letter; use letters, digits or hyphens' : taken ? 'This id is already used' : ''
  const defaultModel = selection?.kind === 'model' ? selection.id : (Object.keys(models)[0] ?? '')

  const create = () => {
    if (!id || error) return
    const building = original ? structuredClone(original) : blankBuilding(kind, defaultModel)
    const { change, select } = useDocument.getState()
    change(doc => insertBuildingAfter(doc, source ?? (selection?.kind === 'building' ? selection.id : undefined), id, building))
    select({ kind: 'building', id })
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">{source ? `Duplicate ${source}` : 'New building'}</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">The id cannot change once the building is saved: saves refer to it.</Dialog.Description>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Id
            <input className={input} autoFocus value={id} onChange={event => setId(event.target.value.trim())} onKeyDown={event => event.key === 'Enter' && create()} />
            {error && <span className="text-xs text-red-600">{error}</span>}
          </label>
          {!source && (
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Kind
              <select className={input} value={kind} onChange={event => setKind(event.target.value as BuildingKind)}>
                {KINDS.map(option => <option key={option}>{option}</option>)}
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
