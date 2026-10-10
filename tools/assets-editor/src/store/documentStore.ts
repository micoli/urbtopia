import { create } from 'zustand'
import type { ModelSource } from '../../../../src/core/models/modelSchema'
import type { CollectionName } from '../../../../scripts/collections'
import type { Catalog, Definitions } from '../api'
import { shipsFrom } from '../library/modelFiles'

export type Doc = Definitions

export type Kind = CollectionName | 'models' | 'singletons'

export interface Selection {
  kind: Kind
  id: string
}

export interface Assets {
  ships: (file: string) => boolean
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
}

const HISTORY_LIMIT = 200

interface DocumentState {
  doc: Doc
  saved: Doc
  past: Doc[]
  future: Doc[]
  assets: Assets
  selection: Selection | null
  kind: Kind
  status: string
  // Shows the comparison of the Game objects of a kind instead of one object.
  comparing: boolean
  // The Tier, and the variant if any, the preview shows for a Game object with Tiers.
  preview: { tier: number; variant?: string }
  load: (catalog: Catalog) => void
  adoptCatalog: (catalog: Catalog) => void
  change: (edit: (doc: Doc) => Doc) => void
  undo: () => void
  redo: () => void
  select: (selection: Selection | null) => void
  showKind: (kind: Kind) => void
  showTier: (tier: number, variant?: string) => void
  markSaved: () => void
  setStatus: (status: string) => void
  setComparing: (comparing: boolean) => void
}

const empty = { models: {}, collections: {}, singletons: {} } as Doc

const assetsOf = ({ manifest, sourceByPack, installablePacks }: Catalog): Assets => ({ ships: shipsFrom(manifest, sourceByPack, installablePacks), manifest, sourceByPack })

export const useDocument = create<DocumentState>()(set => ({
  doc: empty,
  saved: empty,
  past: [],
  future: [],
  assets: { ships: () => false, manifest: {}, sourceByPack: {} },
  selection: null,
  kind: 'buildings',
  status: '',
  comparing: false,
  preview: { tier: 0 },
  load: catalog => {
    const doc: Doc = { models: catalog.models, collections: catalog.collections, singletons: catalog.singletons }
    set({ doc, saved: doc, past: [], future: [], status: '', assets: assetsOf(catalog) })
  },
  // Models added on disk by an import join both the document and its saved state, so pending edits survive.
  adoptCatalog: catalog =>
    set(state => {
      const added = Object.fromEntries(Object.entries(catalog.models).filter(([id]) => !(id in state.saved.models)))
      return {
        doc: { ...state.doc, models: { ...state.doc.models, ...added } },
        saved: { ...state.saved, models: { ...state.saved.models, ...added } },
        assets: assetsOf(catalog),
      }
    }),
  change: edit =>
    set(state => {
      const doc = edit(state.doc)
      if (doc === state.doc) return state
      return { doc, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), future: [], status: '' }
    }),
  undo: () =>
    set(state => {
      const previous = state.past.at(-1)
      if (!previous) return state
      return { doc: previous, past: state.past.slice(0, -1), future: [state.doc, ...state.future], status: '' }
    }),
  redo: () =>
    set(state => {
      const next = state.future[0]
      if (!next) return state
      return { doc: next, past: [...state.past, state.doc], future: state.future.slice(1), status: '' }
    }),
  select: selection => set(selection ? { selection, kind: selection.kind, comparing: false, preview: { tier: 0 } } : { selection }),
  showTier: (tier, variant) => set({ preview: { tier, variant } }),
  showKind: kind => set({ kind, comparing: false }),
  setComparing: comparing => set({ comparing }),
  markSaved: () => set(state => ({ saved: state.doc })),
  setStatus: status => set({ status }),
}))
