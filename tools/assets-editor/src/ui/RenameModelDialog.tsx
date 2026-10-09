import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { MODEL_ID_PATTERN } from '../../../../src/core/models/modelSchema'
import { callAssets, fetchCatalog } from '../api'
import { useDirty } from '../hooks/useDirty'
import { useDocument } from '../store/documentStore'
import { button, dialogContent, dialogOverlay, input } from './styles'

interface Props {
  id: string
  onClose: () => void
}

// A rename rewrites files on disk, so it runs on a saved document and reloads it afterwards.
export function RenameModelDialog({ id, onClose }: Props) {
  const models = useDocument(state => state.doc.models)
  const dirty = useDirty()
  const [next, setNext] = useState(id)
  const [failure, setFailure] = useState('')
  const error = next === id ? '' : !MODEL_ID_PATTERN.test(next) ? 'Lowercase letters and digits separated by single dashes' : next in models ? 'This Model id already exists' : ''

  const rename = async () => {
    if (next === id || error) return
    const problem = await callAssets('rename-model', { from: id, to: next })
    if (problem) return setFailure(problem)
    const { load, select, setStatus } = useDocument.getState()
    load(await fetchCatalog())
    select({ kind: 'model', id: next })
    setStatus(`Renamed ${id} to ${next}`)
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">Rename {id}</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">Every Game object that uses it is rewritten; saves never hold Model ids.</Dialog.Description>
          {dirty.count > 0 ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">Save or undo your {dirty.count} pending change{dirty.count > 1 ? 's' : ''} first.</p>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              New Model id
              <input className={input} autoFocus value={next} onChange={event => setNext(event.target.value.trim())} onKeyDown={event => event.key === 'Enter' && void rename()} />
              {(error || failure) && <span className="text-xs text-red-600">{error || failure}</span>}
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onClose}>Cancel</button>
            <button className={button('primary')} disabled={dirty.count > 0 || next === id || !!error} onClick={() => void rename()}>Rename</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
