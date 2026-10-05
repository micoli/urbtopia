import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

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
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(manifest))
    })
  },
})

export default defineConfig({ plugins: [liveMiscellaneous()], server: { fs: { allow: ['../..'] } } })
