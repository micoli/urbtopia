import { create } from 'zustand'
import type { BuildingDefinitions } from '../../../../src/core/buildings/buildingDefinition'
import type { ModelSource } from '../../../../src/core/models/modelSchema'
import type { ModelDefinitions } from '../../../../scripts/definitionProblems'
import type { Catalog } from '../api'
import { shipsFrom } from '../library/modelFiles'

export interface Doc {
  models: ModelDefinitions
  buildings: BuildingDefinitions
}

export type Kind = 'building' | 'model'

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
  load: (catalog: Catalog) => void
  adoptCatalog: (catalog: Catalog) => void
  change: (edit: (doc: Doc) => Doc) => void
  undo: () => void
  redo: () => void
  select: (selection: Selection | null) => void
  showKind: (kind: Kind) => void
  markSaved: () => void
  setStatus: (status: string) => void
}

const empty: Doc = { models: {}, buildings: {} }

export const useDocument = create<DocumentState>()(set => ({
  doc: empty,
  saved: empty,
  past: [],
  future: [],
  assets: { ships: () => false, manifest: {}, sourceByPack: {} },
  selection: null,
  kind: 'building',
  status: '',
  load: ({ models, buildings, installablePacks, manifest, sourceByPack }) =>
    set({ doc: { models, buildings }, saved: { models, buildings }, past: [], future: [], status: '', assets: { ships: shipsFrom(manifest, sourceByPack, installablePacks), manifest, sourceByPack } }),
  // Models added on disk by an import join both the document and its saved state, so pending edits survive.
  adoptCatalog: ({ models, installablePacks, manifest, sourceByPack }) =>
    set(state => {
      const added = Object.fromEntries(Object.entries(models).filter(([id]) => !(id in state.saved.models)))
      return {
        doc: { ...state.doc, models: { ...state.doc.models, ...added } },
        saved: { ...state.saved, models: { ...state.saved.models, ...added } },
        assets: { ships: shipsFrom(manifest, sourceByPack, installablePacks), manifest, sourceByPack },
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
  select: selection => set(selection ? { selection, kind: selection.kind } : { selection }),
  showKind: kind => set({ kind }),
  markSaved: () => set(state => ({ saved: state.doc })),
  setStatus: status => set({ status }),
}))
