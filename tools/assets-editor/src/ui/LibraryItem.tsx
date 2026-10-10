import { useDraggable } from '@dnd-kit/core'
import type { ModelDrag } from '../dnd'
import type { LibraryEntry } from '../library/modelFiles'
import { Thumbnail } from './Thumbnail'

interface Props {
  entry: LibraryEntry
  users: number
  inScene: boolean
  selected: boolean
  onPick: () => void
}

export function LibraryItem({ entry, users, inScene, selected, onPick }: Props) {
  const data: ModelDrag = { type: 'model', file: entry.file }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `library:${entry.file}`, data })
  const used = users > 0 || inScene

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onPick}
      title={`${entry.id ?? 'not defined yet'} · ${entry.file}`}
      className={`flex cursor-grab flex-col gap-1 rounded-lg p-1.5 text-left ring-1 transition active:cursor-grabbing ${selected ? 'bg-indigo-50 ring-indigo-300' : 'ring-zinc-200 hover:bg-zinc-50'} ${isDragging ? 'opacity-40' : ''}`}
    >
      <Thumbnail file={entry.file} className="aspect-square w-full" />
      <span className="truncate text-[11px] font-medium text-zinc-700">{entry.name.split('/').at(-1)}</span>
      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
        <span className={`h-1.5 w-1.5 rounded-full ${used ? 'bg-emerald-500' : entry.id ? 'bg-zinc-300' : 'bg-transparent ring-1 ring-zinc-300'}`} />
        {users ? `${users} use${users > 1 ? 's' : ''}` : inScene ? 'scene' : entry.id ? 'orphan' : 'undefined'}
      </span>
    </button>
  )
}
