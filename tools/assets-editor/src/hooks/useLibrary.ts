import { MODEL_KEYS } from '../../../../src/scene/renderItems'
import { libraryEntries, locationOf, type LibraryEntry } from '../library/modelFiles'
import { useDocument, type Assets, type Doc } from '../store/documentStore'

export interface Library {
  entries: LibraryEntry[]
  byFile: Map<string, LibraryEntry>
  usersOf: (modelId: string) => string[]
  inScene: (file: string) => boolean
}

const sceneFiles: ReadonlySet<string> = new Set(MODEL_KEYS)

function libraryOf(assets: Assets, doc: Doc): Library {
  const entries = libraryEntries(assets.manifest, assets.sourceByPack, doc.models)
  const users = Map.groupBy(Object.entries(doc.buildings), ([, { model }]) => model)
  return {
    entries,
    byFile: locationOf(entries),
    usersOf: modelId => (users.get(modelId) ?? []).map(([id]) => id),
    inScene: file => sceneFiles.has(file),
  }
}

const cache = new WeakMap<Doc, { assets: Assets; library: Library }>()

export function useLibrary(): Library {
  const assets = useDocument(state => state.assets)
  const doc = useDocument(state => state.doc)
  const cached = cache.get(doc)
  if (cached?.assets === assets) return cached.library
  const library = libraryOf(assets, doc)
  cache.set(doc, { assets, library })
  return library
}
