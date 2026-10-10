import { COLLECTION_NAMES, specOf } from '../../../../scripts/collections'
import { SINGLETON_NAMES } from '../../../../scripts/singletons'
import { useDocument, type Kind } from '../store/documentStore'

const KINDS: { kind: Kind; label: string }[] = [
  ...COLLECTION_NAMES.map(name => ({ kind: name as Kind, label: specOf(name).title })),
  { kind: 'singletons', label: 'Settings' },
  { kind: 'models', label: 'Models' },
]

export function KindNav() {
  const current = useDocument(state => state.kind)
  const doc = useDocument(state => state.doc)
  const showKind = useDocument(state => state.showKind)
  const countOf = (kind: Kind) => (kind === 'models' ? Object.keys(doc.models).length : kind === 'singletons' ? SINGLETON_NAMES.length : Object.keys(doc.collections[kind]).length)

  return (
    <nav className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-200/60 p-1" aria-label="Kinds of Game objects">
      {KINDS.map(({ kind, label }) => (
        <button
          key={kind}
          onClick={() => showKind(kind)}
          className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-xs font-medium transition ${current === kind ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          {label}
          <span className="text-[10px] text-zinc-400">{countOf(kind)}</span>
        </button>
      ))}
    </nav>
  )
}
