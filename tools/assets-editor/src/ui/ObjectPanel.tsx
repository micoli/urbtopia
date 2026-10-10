import type { SingletonName } from '../../../../scripts/singletons'
import { useDocument, type Doc, type Selection } from '../store/documentStore'
import { DefinitionPanel } from './DefinitionPanel'
import { ModelPanel } from './ModelPanel'
import { SingletonPanel } from './SingletonPanel'
import { panel } from './styles'

const exists = (doc: Doc, { kind, id }: Selection) => (kind === 'models' ? id in doc.models : kind === 'singletons' ? id in doc.singletons : id in doc.collections[kind])

export function ObjectPanel() {
  const selection = useDocument(state => state.selection)
  const present = useDocument(state => (state.selection ? exists(state.doc, state.selection) : false))

  if (!selection || !present)
    return (
      <div className={`${panel} flex h-full min-h-64 flex-col items-center justify-center gap-2 p-8 text-center`}>
        <p className="text-sm font-medium text-zinc-700">Pick a Game object or a model</p>
        <p className="max-w-sm text-sm text-zinc-500">Edit its definition here; drag models from the library onto a model field, drop a GLB, a zip or a Poly Pizza link anywhere to import it.</p>
      </div>
    )
  if (selection.kind === 'models') return <ModelPanel key={selection.id} id={selection.id} />
  if (selection.kind === 'singletons') return <SingletonPanel key={selection.id} name={selection.id as SingletonName} />
  return <DefinitionPanel key={`${selection.kind}:${selection.id}`} collection={selection.kind} id={selection.id} />
}
