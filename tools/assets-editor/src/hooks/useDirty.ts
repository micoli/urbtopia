import { useDocument, type Doc, type Kind } from '../store/documentStore'

export interface Dirty {
  count: number
  has: (kind: Kind, id: string) => boolean
}

const changedIds = (current: Record<string, unknown>, saved: Record<string, unknown>) =>
  new Set([...Object.keys(current).filter(id => current[id] !== saved[id]), ...Object.keys(saved).filter(id => !(id in current))])

// Edits replace objects, so an unchanged definition keeps its identity and comparing references is enough.
function dirtyOf(doc: Doc, saved: Doc): Dirty {
  const buildings = changedIds(doc.buildings, saved.buildings)
  const models = changedIds(doc.models, saved.models)
  const reordered = Object.keys(doc.buildings).join() !== Object.keys(saved.buildings).join() ? 1 : 0
  return { count: buildings.size + models.size + reordered, has: (kind, id) => (kind === 'building' ? buildings : models).has(id) }
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
