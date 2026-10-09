import { useMemo, useState } from 'react'
import { modelIdOf } from '../../../../scripts/definitionProblems'
import { useLibrary } from '../hooks/useLibrary'
import { isFreelyDefinable, type LibraryEntry } from '../library/modelFiles'
import { useDocument } from '../store/documentStore'
import { setModel } from '../store/edits'
import { LibraryItem } from './LibraryItem'
import { input, panel } from './styles'

const PAGE = 90
const FILTERS = { all: 'All', used: 'Used', orphan: 'Orphans', undefined: 'Undefined' } as const
type Filter = keyof typeof FILTERS

export function LibraryDrawer() {
  const library = useLibrary()
  const selection = useDocument(state => state.selection)
  const sourceByPack = useDocument(state => state.assets.sourceByPack)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [limit, setLimit] = useState(PAGE)
  const search = query.trim().toLowerCase()
  const sources = useMemo(() => [...new Set(Object.values(sourceByPack).filter(Boolean))], [sourceByPack])

  const statusOf = (entry: LibraryEntry): Filter => (!entry.id ? 'undefined' : library.usersOf(entry.id).length || library.inScene(entry.file) ? 'used' : 'orphan')
  const shown = library.entries.filter(entry => (!search || `${entry.file} ${entry.id ?? ''}`.toLowerCase().includes(search)) && (!source || entry.source === source) && (filter === 'all' || statusOf(entry) === filter))

  // Picking an undefined CC0 model defines it, so it can be edited and used at once.
  const pick = (entry: LibraryEntry) => {
    const { change, select, setStatus } = useDocument.getState()
    if (entry.id) return select({ kind: 'models', id: entry.id })
    if (!isFreelyDefinable(entry.source)) return setStatus(`${entry.file} is not part of a managed source`)
    const id = modelIdOf(entry.file)
    change(doc => setModel(doc, id, { file: entry.file, source: entry.source!, license: 'CC0' }))
    select({ kind: 'models', id })
  }

  return (
    <section className={`${panel} flex min-h-0 flex-col`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Model library</h2>
          <span className="text-xs text-zinc-500">{shown.length} / {library.entries.length}</span>
        </div>
        <input className={input} placeholder="Search files or Model ids" value={query} onChange={event => { setQuery(event.target.value); setLimit(PAGE) }} aria-label="Search the library" />
        <div className="flex gap-2">
          <select className={input} value={source} onChange={event => setSource(event.target.value)} aria-label="Source">
            <option value="">All sources</option>
            {sources.map(name => <option key={name}>{name}</option>)}
          </select>
          <select className={input} value={filter} onChange={event => setFilter(event.target.value as Filter)} aria-label="Status">
            {(Object.keys(FILTERS) as Filter[]).map(key => <option key={key} value={key}>{FILTERS[key]}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-zinc-500">Drag a model onto a model field to use it.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {shown.slice(0, limit).map(entry => (
            <LibraryItem
              key={entry.file}
              entry={entry}
              users={entry.id ? library.usersOf(entry.id).length : 0}
              inScene={library.inScene(entry.file)}
              selected={selection?.kind === 'models' && selection.id === entry.id}
              onPick={() => pick(entry)}
            />
          ))}
        </div>
        {shown.length > limit && (
          <button className="mt-2 w-full rounded-md py-2 text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => setLimit(limit + PAGE)}>
            Show {Math.min(PAGE, shown.length - limit)} more
          </button>
        )}
      </div>
    </section>
  )
}
