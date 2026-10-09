import { useLibrary } from '../hooks/useLibrary'
import { useDocument } from '../store/documentStore'

interface Props {
  modelId: string
}

export function UsedByList({ modelId }: Props) {
  const buildings = useDocument(state => state.doc.buildings)
  const file = useDocument(state => state.doc.models[modelId]?.file ?? '')
  const select = useDocument(state => state.select)
  const library = useLibrary()
  const users = library.usersOf(modelId)
  const inScene = library.inScene(file)

  return (
    <div className="flex flex-col gap-3">
      {inScene && <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600 ring-1 ring-zinc-200">Also used by the scene code (roads, vehicles, Fixtures, Tiers…).</p>}
      {users.length ? (
        <ul className="divide-y divide-zinc-100 rounded-lg ring-1 ring-zinc-200">
          {users.map(id => (
            <li key={id}>
              <button className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50" onClick={() => select({ kind: 'building', id })}>
                <span className="font-medium text-zinc-800">{buildings[id]!.name.en || id}</span>
                <span className="font-mono text-xs text-zinc-500">building · {id}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !inScene && <p className="text-sm text-zinc-500">No Game object uses this model: it is an orphan.</p>
      )}
    </div>
  )
}
