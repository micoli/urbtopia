import { defineConfig } from 'vitest/config';
import { stampServiceWorker } from './build/stampServiceWorker';

const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [stampServiceWorker(BUILD_ID)],
  test: { environment: 'node', include: ['src/**/*.test.ts', 'build/**/*.test.ts'] },
});
