import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { ASSET_PACKS, MANAGED_MODELS_DIR, POLY_PIZZA_DIR } from '../../scripts/assetPacks.ts'
import { managedModelKeys } from '../../scripts/managedModels.ts'
import { readModels, writeModels } from '../../scripts/modelsFile.ts'
import { addGlb, addPack, addPolyPizzaModel, removeModel } from '../../scripts/assetOperations.ts'
import { fetchPolyPizzaModel } from '../../scripts/polyPizza.ts'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), 'public')

const miscellaneousNamesIn = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true }).map(String).filter((file) => file.endsWith('.obj') || file.endsWith('.3mf') || file.endsWith('.glb')).map((file) => file.replace(/\.obj$/, '')).sort()
    : []

// Rescans models/miscellaneous (subfolders included) on each request so dropped-in OBJ, 3MF and GLB files show up without regenerating the manifest.
const liveMiscellaneous = (): Plugin => ({
  name: 'live-miscellaneous-manifest',
  configureServer(server) {
    server.middlewares.use('/manifest.json', (_req, res) => {
      const manifestPath = join(publicDir, 'manifest.json')
      const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
      const miscellaneous = miscellaneousNamesIn(join(publicDir, 'models', 'miscellaneous'))
      if (miscellaneous.length) manifest.miscellaneous = miscellaneous
      Object.assign(manifest, managedPacks(), polyPizzaPacks())
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(manifest))
    })
  },
})

const managedPacks = (): Record<string, string[]> => {
  const packs: Record<string, string[]> = {}
  if (!existsSync(MANAGED_MODELS_DIR)) return packs
  for (const key of managedModelKeys()) (packs[dirname(key)] ??= []).push(basename(key))
  return packs
}

const polyPizzaSlugs = () => (existsSync(POLY_PIZZA_DIR) ? readdirSync(POLY_PIZZA_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort() : [])

const polyPizzaPacks = (): Record<string, string[]> => {
  const slugs = polyPizzaSlugs()
  return slugs.length ? { 'poly.pizza': slugs } : {}
}

const sourcesByPack = () => ({
  ...Object.fromEntries(ASSET_PACKS.map(({ name }) => [name, 'kenney'])),
  ...Object.fromEntries(Object.keys(managedPacks()).map((name) => [name, 'managed'])),
  'poly.pizza': 'poly.pizza',
})

// Serves hand-made and Poly Pizza GLBs straight from assets/, so an added file shows up without copying it.
const liveSources = (): Plugin => ({
  name: 'live-asset-sources',
  configureServer(server) {
    server.middlewares.use('/models', (req, res, next) => {
      const path = decodeURIComponent((req.url ?? '').split('?')[0]!).replace(/^\//, '')
      const slug = path.match(/^poly\.pizza\/([^/]+)\.glb$/)?.[1]
      const file = slug ? join(POLY_PIZZA_DIR, slug, `${slug}.glb`) : join(MANAGED_MODELS_DIR, path)
      if (!resolve(file).startsWith(resolve(slug ? POLY_PIZZA_DIR : MANAGED_MODELS_DIR)) || !existsSync(file) || !file.endsWith('.glb')) return next()
      res.setHeader('Content-Type', 'model/gltf-binary')
      res.end(readFileSync(file))
    })
  },
})

const readBody = (req: NodeJS.ReadableStream) => new Promise<string>((done) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => done(body))
})

// Dev-only adapter: the editor reads and writes assets/models.json through it.
const modelsApi = (): Plugin => ({
  name: 'models-api',
  configureServer(server) {
    server.middlewares.use('/api/packs', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(sourcesByPack()))
    })
    server.middlewares.use('/api/models', async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      if (req.method !== 'PUT') return res.end(JSON.stringify(readModels()))
      try {
        writeModels(JSON.parse(await readBody(req)))
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
  'add-poly': operation(async ({ input, license }: { input: string; license: string }) => addPolyPizzaModel(await fetchPolyPizzaModel(input), license)),
  'add-pack': operation(({ dataBase64, ...input }: WithFile<Parameters<typeof addPack>[0]>) => addPack({ ...input, data: bytesOf(dataBase64) })),
  remove: operation(({ key, usedKeys }: { key: string; usedKeys: string[] }) => removeModel(key, usedKeys)),
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

export default defineConfig({ root: dirname(fileURLToPath(import.meta.url)), plugins: [liveMiscellaneous(), liveSources(), modelsApi(), assetOperationsApi()], server: { fs: { allow: ['../..'] }, watch: { ignored: ['**/assets/models.json'] } } })
