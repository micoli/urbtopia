import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { AutoplayerFirstSequencer } from './build/autoplayerFirstSequencer.ts';
import { guideMdx } from './build/guideMdx.ts';
import { guideDevFallback } from './build/guideDevFallback.ts';
import { stampServiceWorker } from './build/stampServiceWorker.ts';
import { validateDefinitions } from './build/validateDefinitions.ts';

const BUILD_ID = Date.now().toString(36);
const RELEASE_NAME = process.env.RELEASE_NAME ?? 'dev';

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID), __RELEASE_NAME__: JSON.stringify(RELEASE_NAME) },
  plugins: [react(), guideMdx(), tailwindcss(), validateDefinitions(), stampServiceWorker(BUILD_ID), guideDevFallback()],
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), guide: resolve(import.meta.dirname, 'docs/index.html') } } },
  // A failing test runs again, twice at most, before it counts as failed: a flaky test passes on a retry and is reported as such.
  test: {
    environment: 'node',
    retry: 2,
    execArgv: ['--no-experimental-webstorage'],
    sequence: { sequencer: AutoplayerFirstSequencer },
    include: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'build/**/*.test.ts',
        'scripts/**/*.test.ts',
        'tools/**/*.test.ts',
    ],
    exclude: [
        '**/node_modules/**',
        'tools/issues-server/**',
    ] },
});
