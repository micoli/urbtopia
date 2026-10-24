import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS, readExtraPacks } from '../../scripts/assetPacks.ts'
import { extractFbx, type ExtractedFile } from '../../scripts/extractPack.ts'

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

// Packs added from the editor are written to extra-packs.json after the config was loaded, so they are read again here; an archive that no longer exists is skipped.
const quaterniusPacks = () => {
  const extras = readExtraPacks().quaternius.filter((extra) => !QUATERNIUS_PACKS.some((pack) => pack.name === extra.name))
  return [...QUATERNIUS_PACKS, ...extras].filter((pack) => existsSync(join(QUATERNIUS_ARCHIVES_DIR, pack.archive)))
}

const quaterniusFiles = (name: string, archive: string) =>
  unpacked(fbxPackName(name), () => extractFbx(new Uint8Array(readFileSync(join(QUATERNIUS_ARCHIVES_DIR, archive)))))

const namesOf = (files: Map<string, Uint8Array>, extension: string) =>
  [...files.keys()].filter((path) => path.endsWith(extension)).map((path) => path.slice(0, -extension.length)).sort()

export const archiveManifest = (): Record<string, string[]> =>
  Object.fromEntries(quaterniusPacks().map((pack) => [fbxPackName(pack.name), namesOf(quaterniusFiles(pack.name, pack.archive), '.fbx')]))

export function archiveFile(pack: string, path: string): Uint8Array | undefined {
  const quaternius = quaterniusPacks().find((candidate) => fbxPackName(candidate.name) === pack)
  return quaternius && quaterniusFiles(quaternius.name, quaternius.archive).get(path)
}
