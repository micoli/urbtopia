import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  define: { __BUILD_ID__: JSON.stringify('casino-sim') },
  esbuild: { jsx: 'automatic' },
  server: { fs: { allow: ['../..'] } },
});
