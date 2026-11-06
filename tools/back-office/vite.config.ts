import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backOfficeDir = dirname(fileURLToPath(import.meta.url))

// The game accepts saves only from this origin (src/backOffice/handoff.ts), so the port is fixed and bound to localhost.
export default defineConfig({
  root: backOfficeDir,
  cacheDir: resolve(backOfficeDir, '../../node_modules/.vite-back-office'),
  plugins: [react(), tailwindcss()],
  server: { host: 'localhost', port: 5180, strictPort: true, fs: { allow: ['../..'] } },
})
