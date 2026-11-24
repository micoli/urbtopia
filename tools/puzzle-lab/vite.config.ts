import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const labDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(labDir, '../..')

export default defineConfig({
  root: labDir,
  cacheDir: resolve(rootDir, 'node_modules/.vite-puzzle-lab'),
  server: { host: 'localhost', port: 5184, strictPort: true, fs: { allow: [rootDir] } },
})
