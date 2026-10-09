import { useDocument } from '../store/documentStore'
import { BuildingPanel } from './BuildingPanel'
import { ModelPanel } from './ModelPanel'
import { panel } from './styles'

export function ObjectPanel() {
  const selection = useDocument(state => state.selection)
  const exists = useDocument(state => (selection?.kind === 'building' ? selection.id in state.doc.buildings : selection ? selection.id in state.doc.models : false))

  if (!selection || !exists)
    return (
      <div className={`${panel} flex h-full min-h-64 flex-col items-center justify-center gap-2 p-8 text-center`}>
        <p className="text-sm font-medium text-zinc-700">Pick a building or a model</p>
        <p className="max-w-sm text-sm text-zinc-500">Edit its definition here; drag models from the library onto a model field, drop a GLB, a zip or a Poly Pizza link anywhere to import it.</p>
      </div>
    )
  return selection.kind === 'building' ? <BuildingPanel key={selection.id} id={selection.id} /> : <ModelPanel key={selection.id} id={selection.id} />
}
