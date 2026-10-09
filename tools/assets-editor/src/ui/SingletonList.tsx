import { SINGLETON_NAMES, singletonSpecOf } from '../../../../scripts/singletons'
import { useDirty } from '../hooks/useDirty'
import { useProblems } from '../hooks/useProblems'
import { useDocument } from '../store/documentStore'
import { badge, panel } from './styles'

export function SingletonList() {
  const selection = useDocument(state => state.selection)
  const select = useDocument(state => state.select)
  const problems = useProblems()
  const dirty = useDirty()

  return (
    <div className={`${panel} flex min-h-0 flex-1 flex-col overflow-auto p-1`}>
      {SINGLETON_NAMES.map(name => {
        const count = problems.of('singletons', name).length
        return (
          <button
            key={name}
            onClick={() => select({ kind: 'singletons', id: name })}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${selection?.kind === 'singletons' && selection.id === name ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-zinc-100'}`}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium text-zinc-800">{singletonSpecOf(name).title}</span>
              <span className="truncate font-mono text-xs text-zinc-500">{singletonSpecOf(name).file}</span>
            </span>
            {dirty.has('singletons', name) && <span className="h-2 w-2 rounded-full bg-amber-400" title="Modified" />}
            {count > 0 && <span className={badge('red')}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
