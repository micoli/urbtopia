import { useState } from 'react'
import { useDirty } from '../hooks/useDirty'
import { useDocument } from '../store/documentStore'
import { ImportDialog } from './ImportDialog'
import { ProblemsPopover } from './ProblemsPopover'
import { button } from './styles'

interface Props {
  onSave: () => void
}

export function TopBar({ onSave }: Props) {
  const dirty = useDirty()
  const status = useDocument(state => state.status)
  const canUndo = useDocument(state => state.past.length > 0)
  const canRedo = useDocument(state => state.future.length > 0)
  const { undo, redo } = useDocument.getState()
  const [importing, setImporting] = useState(false)

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5">
      <div className="flex items-baseline gap-2">
        <h1 className="text-base font-semibold tracking-tight">Game editor</h1>
        <span className="text-xs text-zinc-500">Urbtopia</span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500" role="status">{status}</span>
        <ProblemsPopover />
        <button className={button('ghost')} onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">↶ Undo</button>
        <button className={button('ghost')} onClick={redo} disabled={!canRedo} title="Redo (⇧⌘Z)">↷ Redo</button>
        <button className={button('secondary')} onClick={() => setImporting(true)}>＋ Import asset</button>
        <button className={button('primary')} onClick={onSave} disabled={dirty.count === 0} title="Save (⌘S)">
          Save{dirty.count ? ` · ${dirty.count}` : ''}
        </button>
      </div>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </header>
  )
}
