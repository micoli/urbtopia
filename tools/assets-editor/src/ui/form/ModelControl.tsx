import { useDroppable } from '@dnd-kit/core'
import { useId } from 'react'
import type { ModelDrop } from '../../dnd'
import { useDocument, type Doc } from '../../store/documentStore'
import { Thumbnail } from '../Thumbnail'
import { CommitInput } from './CommitInput'

interface Props {
  value: string | undefined
  label: string
  dropId: string
  assign: (doc: Doc, modelId: string) => Doc
  onChange: (modelId: string) => void
  compact?: boolean
}

export function ModelControl({ value, label, dropId, assign, onChange, compact }: Props) {
  const models = useDocument(state => state.doc.models)
  const listId = useId()
  const data: ModelDrop = { type: 'model-field', assign }
  const { setNodeRef, isOver, active } = useDroppable({ id: dropId, data })
  const dragging = active?.data.current?.type === 'model'
  const file = value ? models[value]?.file : undefined

  return (
    <div
      ref={setNodeRef}
      className={`flex gap-2 rounded-lg p-2 ring-1 transition ${compact ? 'flex-col items-stretch' : 'items-center gap-3'} ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-500' : dragging ? 'bg-indigo-50/40 ring-indigo-300 ring-dashed' : 'ring-zinc-200'}`}
    >
      <Thumbnail file={file} className={compact ? 'h-20 w-full' : 'h-16 w-16 shrink-0'} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <CommitInput list={listId} aria-label={label} value={value ?? ''} onCommit={next => next.trim() && onChange(next.trim())} />
        <datalist id={listId}>
          {Object.keys(models).map(id => <option key={id} value={id} />)}
        </datalist>
        <span className="truncate text-xs text-zinc-500">{file ?? 'Drop a model from the library, or type a Model id'}</span>
      </div>
    </div>
  )
}
