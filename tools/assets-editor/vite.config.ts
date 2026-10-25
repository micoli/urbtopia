import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { MANAGED_MODELS_DIR } from '../../scripts/assetPacks.ts'
import { archiveFile, archiveManifest, contentTypeOf } from './archiveSources.ts'
import { managedModelFile, managedModelKeys } from '../../scripts/managedModels.ts'
import { deleteDefinition, readCatalog, saveDefinitions } from '../../scripts/definitionsStore.ts'
import { addGlb, addPack, removeModel, renameModel } from '../../scripts/assetOperations.ts'

const editorDir = dirname(fileURLToPath(import.meta.url))
const miscellaneousDir = join(editorDir, 'miscellaneous')

const miscellaneousNamesIn = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true }).map(String).filter((file) => file.endsWith('.obj') || file.endsWith('.3mf') || file.endsWith('.glb')).map((file) => file.replace(/\.obj$/, '')).sort()
    : []

const liveManifestData = (): Record<string, string[]> => {
  const manifest = archiveManifest()
  const miscellaneous = miscellaneousNamesIn(miscellaneousDir)
  if (miscellaneous.length) manifest.miscellaneous = miscellaneous
  return Object.assign(manifest, managedPacks())
}

// Builds the manifest on each request: archives are unzipped on demand and the miscellaneous folder (subfolders included) is rescanned, so dropped-in OBJ, 3MF and GLB files show up without a restart.
const liveManifest = (): Plugin => ({
  name: 'live-manifest',
  configureServer(server) {
    server.middlewares.use('/manifest.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(liveManifestData()))
    })
  },
})

const managedPacks = (): Record<string, string[]> => {
  const packs: Record<string, string[]> = {}
  if (!existsSync(MANAGED_MODELS_DIR)) return packs
  for (const key of managedModelKeys()) (packs[dirname(key)] ??= []).push(basename(key))
  return packs
}

const sourcesByPack = () => Object.fromEntries(Object.keys(managedPacks()).map((name) => [name, 'managed']))

// Maps a served path such as buildings/mosque.glb or buildings/mosque.tone-b.png to its file in the model's own folder.
const managedFileOf = (path: string) => {
  const [, key = '', suffix = ''] = path.match(/^(.+?)(\.(?:glb|tone-.\.png))$/) ?? []
  return managedModelFile(key, suffix)
}

// Serves models without copying them: archive entries from memory, hand-made GLBs from assets/, miscellaneous files from their folder.
const liveSources = (): Plugin => ({
  name: 'live-asset-sources',
  configureServer(server) {
    server.middlewares.use('/models', (req, res, next) => {
      const path = decodeURIComponent((req.url ?? '').split('?')[0]!).replace(/^\//, '')
      const [pack = '', ...rest] = path.split('/')
      const archived = archiveFile(pack, rest.join('/'))
      if (archived) {
        res.setHeader('Content-Type', contentTypeOf(path))
        return res.end(archived)
      }
      const root = pack === 'miscellaneous' ? miscellaneousDir : MANAGED_MODELS_DIR
      const file = pack === 'miscellaneous' ? join(root, rest.join('/')) : managedFileOf(path)
      if (!resolve(file).startsWith(resolve(root)) || !existsSync(file)) return next()
      res.setHeader('Content-Type', contentTypeOf(file))
      res.end(readFileSync(file))
    })
  },
})

const readBody = (req: NodeJS.ReadableStream) => new Promise<string>((done) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => done(body))
})

// Dev-only adapter: the editor reads the catalog and saves assets/models.json and assets/defs/buildings through it.
const modelsApi = (): Plugin => ({
  name: 'models-api',
  configureServer(server) {
    server.middlewares.use('/api/packs', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(sourcesByPack()))
    })
    server.middlewares.use('/api/catalog', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ...readCatalog(), manifest: liveManifestData(), sourceByPack: sourcesByPack() }))
    })
    server.middlewares.use('/api/definitions', async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      if (req.method !== 'PUT') {
        res.statusCode = 405
        return res.end(JSON.stringify({ error: 'PUT only' }))
      }
      try {
        saveDefinitions(JSON.parse(await readBody(req)))
        res.end(JSON.stringify({ ok: true }))
      } catch (error) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
      }
    })
  },
})

const bytesOf = (base64: string) => new Uint8Array(Buffer.from(base64, 'base64'))

type WithFile<T extends { data: Uint8Array }> = Omit<T, 'data'> & { dataBase64: string }
type Operation = (body: never) => Promise<unknown> | unknown

const operation = <Body,>(run: (body: Body) => Promise<unknown> | unknown): Operation => run as Operation

const OPERATIONS: Record<string, Operation> = {
  'add-glb': operation(({ dataBase64, ...input }: WithFile<Parameters<typeof addGlb>[0]>) => addGlb({ ...input, data: bytesOf(dataBase64) })),
  'add-pack': operation(({ dataBase64, ...input }: WithFile<Parameters<typeof addPack>[0]>) => addPack({ ...input, data: bytesOf(dataBase64) })),
  remove: operation(({ key, usedKeys }: { key: string; usedKeys: string[] }) => removeModel(key, usedKeys)),
  'rename-model': operation(({ from, to }: { from: string; to: string }) => renameModel(from, to)),
  'delete-definition': operation(({ collection, id }: { collection: Parameters<typeof deleteDefinition>[0]; id: string }) => deleteDefinition(collection, id)),
}

// Operations change the sources, so the game's generated public/models is refreshed afterwards.
const assetOperationsApi = (): Plugin => ({
  name: 'asset-operations-api',
  configureServer(server) {
    server.middlewares.use('/api/assets', async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      const run = OPERATIONS[(req.url ?? '').replace(/^\//, '')]
      if (req.method !== 'POST' || !run) {
        res.statusCode = 404
        return res.end(JSON.stringify({ error: 'unknown operation' }))
      }
      try {
        const result = await run(JSON.parse(await readBody(req)))
        execFileSync('node', ['scripts/install-assets.ts'], { stdio: 'ignore' })
        res.end(JSON.stringify({ ok: true, result }))
      } catch (error) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
      }
    })
  },
})

export default defineConfig({ root: dirname(fileURLToPath(import.meta.url)), cacheDir: resolve(editorDir, '../../node_modules/.vite-assets-editor'), plugins: [tailwindcss(), liveManifest(), liveSources(), modelsApi(), assetOperationsApi()], server: { fs: { allow: ['../..'] }, watch: { ignored: ['**/assets/models.json', '**/assets/defs/**'] } } })
