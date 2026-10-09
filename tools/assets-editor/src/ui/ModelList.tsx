import { useMemo, useState } from 'react'
import { useDirty } from '../hooks/useDirty'
import { useLibrary } from '../hooks/useLibrary'
import { useProblems } from '../hooks/useProblems'
import { useDocument } from '../store/documentStore'
import { badge, input, panel } from './styles'

const PAGE = 200

export function ModelList() {
  const models = useDocument(state => state.doc.models)
  const selection = useDocument(state => state.selection)
  const select = useDocument(state => state.select)
  const library = useLibrary()
  const problems = useProblems()
  const dirty = useDirty()
  const [query, setQuery] = useState('')
  const [orphansOnly, setOrphansOnly] = useState(false)
  const search = query.trim().toLowerCase()

  const ids = useMemo(
    () => Object.keys(models).sort().filter(id => (!search || `${id} ${models[id]!.file}`.toLowerCase().includes(search)) && (!orphansOnly || (!library.usersOf(id).length && !library.inScene(models[id]!.file)))),
    [models, search, orphansOnly, library],
  )

  return (
    <div className={`${panel} flex min-h-0 flex-1 flex-col`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-2">
        <input className={input} placeholder="Search Model ids or files" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search models" />
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input type="checkbox" checked={orphansOnly} onChange={event => setOrphansOnly(event.target.checked)} /> Orphans only (used by nothing)
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        {ids.slice(0, PAGE).map(id => {
          const selected = selection?.kind === 'models' && selection.id === id
          const count = problems.of('models', id).length
          return (
            <button key={id} onClick={() => select({ kind: 'models', id })} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${selected ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-zinc-100'}`}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-zinc-800">{id}</span>
                <span className="truncate text-xs text-zinc-500">{models[id]!.file}</span>
              </span>
              {dirty.has('models', id) && <span className="h-2 w-2 rounded-full bg-amber-400" title="Modified" />}
              {count > 0 && <span className={badge('red')}>{count}</span>}
            </button>
          )
        })}
        {ids.length > PAGE && <p className="p-2 text-center text-xs text-zinc-500">{ids.length - PAGE} more: refine the search</p>}
      </div>
    </div>
  )
}
