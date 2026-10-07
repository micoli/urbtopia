import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ARCHIVES_DIR, ASSET_PACKS, QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS, readExtraPacks, type AssetPack } from '../../scripts/assetPacks.ts'
import { extractFbx, extractPack, type ExtractedFile } from '../../scripts/extractPack.ts'

export const fbxPackName = (pack: string) => `quaternius-${pack}`

const CONTENT_TYPES: Record<string, string> = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.fbx': 'application/octet-stream' }

export const contentTypeOf = (file: string) => CONTENT_TYPES[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream'

const cache = new Map<string, Map<string, Uint8Array>>()

const unpacked = (name: string, extract: () => ExtractedFile[]) => {
  const known = cache.get(name)
  if (known) return known
  const files = new Map(extract().map((file) => [file.path, file.data]))
  cache.set(name, files)
  return files
}

// Packs added from the editor are written to extra-packs.json after the config was loaded, so they are read again here.
const kenneyPacks = (): AssetPack[] => {
  const extras = readExtraPacks().kenney.filter((extra) => !ASSET_PACKS.some((pack) => pack.name === extra.name))
  return [...ASSET_PACKS, ...extras.map(({ name, archive, colormap }) => ({ name, url: '', archive, files: [], colormap }))]
}

const quaterniusPacks = () => {
  const extras = readExtraPacks().quaternius.filter((extra) => !QUATERNIUS_PACKS.some((pack) => pack.name === extra.name))
  return [...QUATERNIUS_PACKS, ...extras]
}

const kenneyFiles = (pack: AssetPack) =>
  unpacked(pack.name, () => extractPack(new Uint8Array(readFileSync(join(ARCHIVES_DIR, pack.archive))), 'all', pack.colormap))

const quaterniusFiles = (name: string, archive: string) =>
  unpacked(fbxPackName(name), () => extractFbx(new Uint8Array(readFileSync(join(QUATERNIUS_ARCHIVES_DIR, archive)))))

const namesOf = (files: Map<string, Uint8Array>, extension: string) =>
  [...files.keys()].filter((path) => path.endsWith(extension)).map((path) => path.slice(0, -extension.length)).sort()

export function archiveManifest(): Record<string, string[]> {
  return {
    ...Object.fromEntries(kenneyPacks().map((pack) => [pack.name, namesOf(kenneyFiles(pack), '.glb')])),
    ...Object.fromEntries(quaterniusPacks().map((pack) => [fbxPackName(pack.name), namesOf(quaterniusFiles(pack.name, pack.archive), '.fbx')])),
  }
}

export const kenneyPackNames = () => kenneyPacks().map((pack) => pack.name)

export function archiveFile(pack: string, path: string): Uint8Array | undefined {
  const kenney = kenneyPacks().find((candidate) => candidate.name === pack)
  if (kenney) return kenneyFiles(kenney).get(path)
  const quaternius = quaterniusPacks().find((candidate) => fbxPackName(candidate.name) === pack)
  if (quaternius) return quaterniusFiles(quaternius.name, quaternius.archive).get(path)
  return undefined
}
