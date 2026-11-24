import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { MANAGED_MODELS_DIR } from '../../scripts/assetPacks.ts'
import { managedModelFile } from '../../scripts/managedModels.ts'

const labDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(labDir, '../..')
const modelsDir = resolve(rootDir, MANAGED_MODELS_DIR)

// Serves the managed models from their folders, at /glb/<theme>/<name>.glb, the way the glb-viewer does, so that the lab loads the files the game ships.
const managedModels = (): Plugin => ({
  name: 'managed-models',
  configureServer(server) {
    server.middlewares.use('/glb', (req, res, next) => {
      const path = decodeURIComponent((req.url ?? '').split('?')[0]!).replace(/^\//, '')
      const [, key = '', suffix = ''] = path.match(/^(.+?)(\.glb)$/) ?? []
      const file = managedModelFile(key, suffix, modelsDir)
      if (!key || !resolve(file).startsWith(modelsDir) || !existsSync(file)) return next()
      res.setHeader('Content-Type', 'model/gltf-binary')
      res.setHeader('Cache-Control', 'no-store')
      res.end(readFileSync(file))
    })
  },
})

export default defineConfig({
  root: labDir,
  cacheDir: resolve(rootDir, 'node_modules/.vite-puzzle-lab'),
  plugins: [managedModels()],
  server: { host: 'localhost', port: 5184, strictPort: true, fs: { allow: [rootDir] } },
})
