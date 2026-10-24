import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { guideMdx } from './build/guideMdx.ts';
import { guideDevFallback } from './build/guideDevFallback.ts';
import { stampServiceWorker } from './build/stampServiceWorker';
import { validateDefinitions } from './build/validateDefinitions.ts';

const BUILD_ID = Date.now().toString(36);
const RELEASE_NAME = process.env.RELEASE_NAME ?? 'dev';

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID), __RELEASE_NAME__: JSON.stringify(RELEASE_NAME) },
  plugins: [guideMdx(), tailwindcss(), validateDefinitions(), stampServiceWorker(BUILD_ID), guideDevFallback()],
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), guide: resolve(import.meta.dirname, 'docs/index.html') } } },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'build/**/*.test.ts', 'scripts/**/*.test.ts', 'tools/**/*.test.ts'], exclude: ['**/node_modules/**', 'tools/issues-server/**'] },
});
