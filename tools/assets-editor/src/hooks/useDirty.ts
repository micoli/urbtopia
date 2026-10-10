import { COLLECTION_NAMES } from '../../../../scripts/collections'
import { useDocument, type Doc, type Kind } from '../store/documentStore'

export interface Dirty {
  count: number
  has: (kind: Kind, id: string) => boolean
}

const changedIds = (current: Record<string, unknown>, saved: Record<string, unknown>) =>
  new Set([...Object.keys(current).filter(id => current[id] !== saved[id]), ...Object.keys(saved).filter(id => !(id in current))])

const reordered = (current: Record<string, unknown>, saved: Record<string, unknown>) => (Object.keys(current).join() !== Object.keys(saved).join() ? 1 : 0)

// Edits replace objects, so an unchanged definition keeps its identity and comparing references is enough.
function dirtyOf(doc: Doc, saved: Doc): Dirty {
  const changed = new Map<Kind, Set<string>>([
    ['models', changedIds(doc.models, saved.models)],
    ['singletons', changedIds(doc.singletons, saved.singletons)],
    ...COLLECTION_NAMES.map((name): [Kind, Set<string>] => [name, changedIds(doc.collections[name], saved.collections[name])]),
  ])
  const moves = COLLECTION_NAMES.reduce((total, name) => total + reordered(doc.collections[name], saved.collections[name]), 0)
  const count = [...changed.values()].reduce((total, ids) => total + ids.size, moves)
  return { count, has: (kind, id) => changed.get(kind)?.has(id) ?? false }
}

const cache = new WeakMap<Doc, { saved: Doc; dirty: Dirty }>()

export function useDirty(): Dirty {
  const doc = useDocument(state => state.doc)
  const saved = useDocument(state => state.saved)
  const cached = cache.get(doc)
  if (cached?.saved === saved) return cached.dirty
  const dirty = dirtyOf(doc, saved)
  cache.set(doc, { saved, dirty })
  return dirty
}
