import { defineConfig } from 'vitest/config';
import { stampServiceWorker } from './build/stampServiceWorker';
import { validateDefinitions } from './build/validateDefinitions';

const BUILD_ID = Date.now().toString(36);
const RELEASE_NAME = process.env.RELEASE_NAME ?? 'dev';

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID), __RELEASE_NAME__: JSON.stringify(RELEASE_NAME) },
  plugins: [validateDefinitions(), stampServiceWorker(BUILD_ID)],
  test: { environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'build/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
