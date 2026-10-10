import type { ModelSource } from '../../../../src/core/models/modelSchema'
import type { ModelDefinitions } from '../../../../scripts/definitionProblems'
import { definitionKey, sourceOf } from '../assetKeys'

export interface LibraryEntry {
  file: string
  pack: string
  name: string
  source: ModelSource | undefined
  id: string | undefined
}

// Every model of every source, named by its file, with the Model id that defines it if any.
export function libraryEntries(manifest: Record<string, string[]>, sourceByPack: Record<string, ModelSource | undefined>, models: ModelDefinitions): LibraryEntry[] {
  const idByFile = new Map(Object.entries(models).map(([id, { file }]) => [file, id]))
  return Object.entries(manifest).flatMap(([pack, names]) =>
    names.map(name => {
      const file = definitionKey(pack, name)
      return { file, pack, name, source: sourceOf(pack, sourceByPack), id: idByFile.get(file) }
    }),
  )
}

// The same rule as the build: a model of an installable pack, a hand-made or a Poly Pizza model can ship with the game.
export function shipsFrom(manifest: Record<string, string[]>, sourceByPack: Record<string, ModelSource | undefined>, installablePacks: readonly string[]): (file: string) => boolean {
  const packs = new Set(installablePacks)
  const sources = new Map(libraryEntries(manifest, sourceByPack, {}).map(({ file, source }) => [file, source]))
  return file => {
    const source = sources.get(file)
    return source === 'managed' || source === 'poly.pizza' || (source !== undefined && packs.has(file.split('/')[0]!))
  }
}

export const locationOf = (entries: readonly LibraryEntry[]) => new Map(entries.map(entry => [entry.file, entry]))

// Kenney and Quaternius models are CC0: they get a definition the moment a Game object uses them.
export const isFreelyDefinable = (source: ModelSource | undefined) => source === 'kenney' || source === 'quaternius'
