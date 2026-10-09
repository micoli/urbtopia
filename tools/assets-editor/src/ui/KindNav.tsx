import { useDocument, type Kind } from '../store/documentStore'

const KINDS: { kind: Kind; label: string }[] = [
  { kind: 'building', label: 'Buildings' },
  { kind: 'model', label: 'Models' },
]

export function KindNav() {
  const current = useDocument(state => state.kind)
  const doc = useDocument(state => state.doc)
  const showKind = useDocument(state => state.showKind)
  const counts: Record<Kind, number> = { building: Object.keys(doc.buildings).length, model: Object.keys(doc.models).length }

  return (
    <nav className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-200/60 p-1" aria-label="Kinds of Game objects">
      {KINDS.map(({ kind, label }) => (
        <button
          key={kind}
          onClick={() => showKind(kind)}
          className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition ${current === kind ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          {label}
          <span className="text-xs text-zinc-400">{counts[kind]}</span>
        </button>
      ))}
    </nav>
  )
}
