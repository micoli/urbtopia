import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { MANAGED_MODELS_DIR } from '../../scripts/assetPacks.ts'
import { managedModelFile, managedModelKeys } from '../../scripts/managedModels.ts'

const viewerDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(viewerDir, '../..')
const modelsDir = resolve(rootDir, MANAGED_MODELS_DIR)
const RELOAD_DELAY_MS = 200

const tonesOf = (key: string) => {
  const folder = dirname(managedModelFile(key, '.glb', modelsDir))
  const prefix = `${basename(key)}.tone-`
  const letters = readdirSync(folder).filter((file) => file.startsWith(prefix) && file.endsWith('.png')).map((file) => file.slice(prefix.length, -'.png'.length))
  return ['a', ...letters.sort()]
}

const listModels = () => managedModelKeys(modelsDir).map((key) => ({ key, tones: tonesOf(key), modified: statSync(managedModelFile(key, '.glb', modelsDir)).mtimeMs }))

const contentTypeOf = (file: string) => (file.endsWith('.png') ? 'image/png' : 'model/gltf-binary')

// Serves the managed models straight from their folders and tells the page when a GLB or a tone texture is written, so a Blender export shows up at once.
const managedModels = (): Plugin => ({
  name: 'managed-models',
  configureServer(server) {
    server.middlewares.use('/api/models', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(listModels()))
    })
    server.middlewares.use('/glb', (req, res, next) => {
      const path = decodeURIComponent((req.url ?? '').split('?')[0]!).replace(/^\//, '')
      const [, key = '', suffix = ''] = path.match(/^(.+?)(\.(?:glb|tone-.\.png))$/) ?? []
      const file = managedModelFile(key, suffix, modelsDir)
      if (!key || !resolve(file).startsWith(modelsDir) || !existsSync(file)) return next()
      res.setHeader('Content-Type', contentTypeOf(file))
      res.setHeader('Cache-Control', 'no-store')
      res.end(readFileSync(file))
    })
    server.watcher.add(modelsDir)
    let timer: ReturnType<typeof setTimeout> | undefined
    const announce = (file: string) => {
      if (!file.startsWith(modelsDir) || !/\.(glb|png)$/.test(file)) return
      clearTimeout(timer)
      timer = setTimeout(() => server.ws.send({ type: 'custom', event: 'models-changed' }), RELOAD_DELAY_MS)
    }
    for (const event of ['add', 'change', 'unlink'] as const) server.watcher.on(event, announce)
  },
})

export default defineConfig({
  root: viewerDir,
  cacheDir: resolve(rootDir, 'node_modules/.vite-glb-viewer'),
  plugins: [managedModels()],
  server: { host: 'localhost', port: 5190, strictPort: true, fs: { allow: [rootDir] } },
})
