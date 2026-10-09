import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BuildingDrag } from '../dnd'
import { useDirty } from '../hooks/useDirty'
import { useProblems } from '../hooks/useProblems'
import { useDocument } from '../store/documentStore'
import { badge } from './styles'

interface Props {
  id: string
  section: string
}

export function BuildingRow({ id, section }: Props) {
  const building = useDocument(state => state.doc.buildings[id]!)
  const selected = useDocument(state => state.selection?.kind === 'building' && state.selection.id === id)
  const select = useDocument(state => state.select)
  const problems = useProblems().of('building', id)
  const dirty = useDirty().has('building', id)
  const data: BuildingDrag = { type: 'building', id, section }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${selected ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-zinc-100'} ${isDragging ? 'opacity-40' : ''}`}
    >
      <span {...attributes} {...listeners} className="cursor-grab text-zinc-300 group-hover:text-zinc-500" aria-label={`Move ${id}`}>⋮⋮</span>
      <button className="flex min-w-0 flex-1 flex-col items-start text-left" onClick={() => select({ kind: 'building', id })}>
        <span className={`truncate font-medium ${building.retired ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>{building.name.en || id}</span>
        <span className="truncate text-xs text-zinc-500">{id}</span>
      </button>
      {dirty && <span className="h-2 w-2 rounded-full bg-amber-400" title="Modified" />}
      {problems.length > 0 && <span className={badge('red')}>{problems.length}</span>}
      {building.kind !== 'standard' && <span className={badge('indigo')}>{building.kind}</span>}
    </div>
  )
}
