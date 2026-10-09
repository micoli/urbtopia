import { MODEL_KEYS } from '../../../../src/scene/renderItems'
import { COLLECTION_NAMES, specOf, type CollectionName } from '../../../../scripts/collections'
import { libraryEntries, locationOf, type LibraryEntry } from '../library/modelFiles'
import { useDocument, type Assets, type Doc } from '../store/documentStore'

export interface ModelUser {
  collection: CollectionName
  id: string
}

export interface Library {
  entries: LibraryEntry[]
  byFile: Map<string, LibraryEntry>
  usersOf: (modelId: string) => ModelUser[]
  inScene: (file: string) => boolean
}

const sceneFiles: ReadonlySet<string> = new Set(MODEL_KEYS)

function libraryOf(assets: Assets, doc: Doc): Library {
  const entries = libraryEntries(assets.manifest, assets.sourceByPack, doc.models)
  const references = COLLECTION_NAMES.flatMap(collection =>
    Object.entries(doc.collections[collection]).flatMap(([id, definition]) =>
      specOf(collection).references(definition as never).filter(({ target }) => target === 'models').map(({ id: model }) => ({ model, user: { collection, id } })),
    ),
  )
  const users = Map.groupBy(references, ({ model }) => model)
  return {
    entries,
    byFile: locationOf(entries),
    usersOf: modelId => [...new Map((users.get(modelId) ?? []).map(({ user }) => [`${user.collection}:${user.id}`, user])).values()],
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
