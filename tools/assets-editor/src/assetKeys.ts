import type { ModelDefinition, ModelSource } from '../../../src/scene/modelDefinitions'

export type Definitions = Record<string, ModelDefinition>

export const isFbxPack = (pack: string) => pack.startsWith('quaternius-')
export const isObjPack = (pack: string) => pack === 'miscellaneous'

export const assetKey = (pack: string, name: string) => `${pack}/${name}`

// Quaternius FBX packs are listed as quaternius-<pack> but the game keys them <pack>/<name>.
export const definitionKey = (pack: string, name: string) => (isFbxPack(pack) ? `${pack.slice('quaternius-'.length)}/${name}` : assetKey(pack, name))

export const sourceOf = (pack: string, sourceByPack: Record<string, ModelSource | undefined>): ModelSource | undefined => (isFbxPack(pack) ? 'quaternius' : sourceByPack[pack])

export interface Asset {
  pack: string
  name: string
}

export const defaultLicense = (source: ModelSource) => (source === 'kenney' || source === 'quaternius' ? 'CC0' : '')
